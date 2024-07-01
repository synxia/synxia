const mediaQueries = {
  phone: '(max-width: 480px)',
  tablet: '(481px<=width<=768px)',
  laptop: '(769px<=width<=1024px)',
  pc: '(min-width: 1025px)',
};

const encode = (str) => str.replace(/[^a-zA-Z0-9]/g, (c) => `__${c.charCodeAt(0)}__`);
const decode = (str) => str.replace(/__(\d+)__/g, (match, p1) => String.fromCharCode(p1)).replace(/~/g, ' ');
const svar = (str) => str.replace(/--([^${}\s]+)\b/g, 'var(--$1)');

const inject = (rule, media) => {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'synxia-style';
  document.head.appendChild(styleSheet);
    if (media) {
    const mediaRule = `@media only screen and ${media}{${rule}}`;
    styleSheet.sheet.insertRule(mediaRule, styleSheet.sheet.cssRules.length);
  } else {
    styleSheet.sheet.insertRule(rule, styleSheet.sheet.cssRules.length);
  }
};

const generateClasses = (property, value, media, selector) => {
  const className = `${encode(property)}_${encode(value)}`;
  const rule = `${property}:${svar(decode(value))}`;
  inject(`.${className}${selector}{${rule}}`, media);
  return className;
};

const parseClasses = (classNames) => {
  return classNames.split(' ').map((className) => {
    let media = null;
    let selector = '';

    if (className.includes('@')) {
      const [mediaPrefix, rest] = className.split('@');
      if (mediaQueries[mediaPrefix]) {
        media = mediaQueries[mediaPrefix];
        className = rest;
      }
    }

    if (className.includes('dark.') || className.includes('light.')) {
      const mode = className.includes('dark.') ? 'dark' : 'light';
      const rest = className.split('.').slice(1).join('.');
      media = `(prefers-color-scheme: ${mode})`;
      className = rest;
    }

    while (className.indexOf(':') !== -1 && className.indexOf(':') < className.indexOf('_')) {
      const [selectorPrefix, rest] = className.split(/:(.*)/);
      selector += `:${selectorPrefix}`;
      className = rest;
    }

    const [property, value] = className.split('_');
    if (property && value) {
      return generateClasses(decode(property), decode(value), media, selector);
    }
  }).filter(Boolean);
};

const applyStyles = (element) => {
  const classNames = element.className;
  const parsed = parseClasses(classNames).join(' ');
  element.className = parsed;
};

document.querySelectorAll('[class*="_"]').forEach(applyStyles);

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node;
          if (element.className.includes('_')) {
            applyStyles(element);
          }
          const config = { attributes: true, attributeFilter: ['class'] };
          const attrObserver = new MutationObserver((attrMutations) => {
            attrMutations.forEach((attrMutation) => {
              if (attrMutation.type === 'attributes') {
                const targetElement = attrMutation.target;
                if (targetElement.className.includes('_')) {
                  applyStyles(targetElement);
                }
              }
            });
          });
          attrObserver.observe(element, config);
        }
      });
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});   

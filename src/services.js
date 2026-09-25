const explorer = document.getElementById('servicesExplorer');
if (explorer) {
  const tabs = [...explorer.querySelectorAll('.service-tabs [data-service]')];
  const panels = [...explorer.querySelectorAll('.service-panel')];
  const tablist = explorer.querySelector('.service-tabs');
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-orientation', 'vertical');

  function selectService(selected) {
    explorer.dataset.service = tabs[selected].dataset.service;
    tabs.forEach((tab, index) => {
      const active = index === selected;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[index].setAttribute('role', 'tabpanel');
      panels[index].setAttribute('aria-labelledby', tab.id);
      panels[index].tabIndex = active ? 0 : -1;
      panels[index].hidden = !active;
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectService(index));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectService(next);
      tabs[next].focus();
    });
  });

  selectService(0);
  explorer.classList.add('services-ready');
}

const responsiveDemo = document.getElementById('responsiveDemo');
if (responsiveDemo) {
  responsiveDemo.querySelectorAll('[data-preview]').forEach((button) => {
    button.addEventListener('click', () => {
      const mobile = button.dataset.preview === 'mobile';
      responsiveDemo.dataset.view = button.dataset.preview;
      responsiveDemo.querySelector('.preview-desktop').hidden = mobile;
      responsiveDemo.querySelector('.preview-mobile').hidden = !mobile;
      responsiveDemo.querySelectorAll('[data-preview]').forEach((control) => control.setAttribute('aria-pressed', String(control === button)));
    });
  });
}

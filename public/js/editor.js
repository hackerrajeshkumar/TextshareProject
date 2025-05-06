// Editor functionality
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const textEditor = document.getElementById('text-editor');
  const previewToggle = document.getElementById('preview-toggle');
  const editorPane = document.querySelector('.editor-pane');
  const previewPane = document.querySelector('.preview-pane');
  const previewContent = document.getElementById('preview-content');
  const syntaxSelect = document.getElementById('syntax-select');

  // State
  let previewMode = 'none'; // none, split, full

  // Initialize editor
  initializeEditor();

  // Preview toggle
  previewToggle.addEventListener('click', () => {
    switch (previewMode) {
      case 'none':
        // Switch to split view
        previewMode = 'split';
        editorPane.classList.add('split');
        previewPane.classList.add('split');
        previewPane.style.display = 'block';
        updatePreview();
        break;
      case 'split':
        // Switch to preview only
        previewMode = 'full';
        editorPane.style.display = 'none';
        previewPane.classList.remove('split');
        break;
      case 'full':
        // Switch back to editor only
        previewMode = 'none';
        editorPane.style.display = 'block';
        editorPane.classList.remove('split');
        previewPane.style.display = 'none';
        break;
    }

    // Update icon
    updatePreviewIcon();
  });

  // Update preview when text changes
  textEditor.addEventListener('input', debounce((e) => {
    updatePreview();

    // Send real-time updates to other users
    const currentTextId = window.location.pathname.split('/').filter(Boolean)[0];
    if (currentTextId && window.socket) {
      window.socket.emit('text-update', {
        textId: currentTextId,
        text: textEditor.value,
        syntax: syntaxSelect.value
      });
    }
  }, 300));

  // Update preview when syntax changes
  syntaxSelect.addEventListener('change', updatePreview);

  // Initialize editor
  function initializeEditor() {
    // Set initial state
    previewMode = 'none';
    editorPane.classList.add('active');
    previewPane.classList.remove('active');

    // Focus editor
    textEditor.focus();

    // Add notification styles
    addNotificationStyles();

    // Make socket available globally
    window.socket = io();
  }

  // Update preview content
  function updatePreview() {
    if (previewMode === 'none') return;

    const text = textEditor.value;
    const syntax = syntaxSelect.value;

    // Clear previous content
    previewContent.innerHTML = '';

    if (syntax === 'markdown') {
      // Render markdown
      previewContent.innerHTML = marked.parse(text);
    } else if (syntax !== 'plain') {
      // Syntax highlighting
      const codeElement = document.createElement('pre');
      const codeBlock = document.createElement('code');
      codeBlock.className = `language-${syntax}`;
      codeBlock.textContent = text;
      codeElement.appendChild(codeBlock);
      previewContent.appendChild(codeElement);

      // Apply highlighting
      hljs.highlightElement(codeBlock);
    } else {
      // Plain text
      previewContent.textContent = text;
    }
  }

  // Update preview icon based on current mode
  function updatePreviewIcon() {
    const icon = previewToggle.querySelector('i');

    switch (previewMode) {
      case 'none':
        icon.className = 'fas fa-eye';
        break;
      case 'split':
        icon.className = 'fas fa-columns';
        break;
      case 'full':
        icon.className = 'fas fa-edit';
        break;
    }
  }

  // Add notification styles
  function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 1000;
      }

      .notification.show {
        transform: translateY(0);
        opacity: 1;
      }

      .notification.success {
        background-color: var(--success-color);
      }

      .notification.error {
        background-color: var(--error-color);
      }

      .notification.info {
        background-color: var(--primary-color);
      }
    `;

    document.head.appendChild(style);
  }

  // Debounce function to limit how often a function is called
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Make updatePreview available globally
  window.updatePreview = updatePreview;
});

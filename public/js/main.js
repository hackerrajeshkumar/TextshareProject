// Main application functionality
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const secureToggle = document.getElementById('secure-toggle');
  const secureSettings = document.querySelector('.secure-settings');
  const passwordInput = document.getElementById('password-input');
  const strengthBar = document.querySelector('.strength-bar');
  const saveBtn = document.getElementById('save-btn');
  const shareUrl = document.getElementById('share-url');
  const copyUrlBtn = document.getElementById('copy-url-btn');
  const qrCodeBtn = document.getElementById('qr-code-btn');
  const qrModal = document.getElementById('qr-modal');
  const qrCodeContainer = document.getElementById('qr-code-container');
  const passwordModal = document.getElementById('password-modal');
  const passwordPrompt = document.getElementById('password-prompt');
  const submitPassword = document.getElementById('submit-password');
  const passwordError = document.getElementById('password-error');
  const closeButtons = document.querySelectorAll('.close');
  const codeDisplay = document.getElementById('code-display');
  const copyCodeBtn = document.getElementById('copy-code-btn');
  const codeInput = document.getElementById('code-input');
  const loadCodeBtn = document.getElementById('load-code-btn');
  const expiryTimerDisplay = document.getElementById('expiry-timer-display');

  // State
  let currentTextId = null;
  let isProtected = false;
  let expiryTimerId = null;
  let expiryTimestamp = null;

  // Generate a default share URL on page load
  generateDefaultShareUrl();

  // Theme toggle
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    // Update icon
    const icon = themeToggleBtn.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }

    // Save preference to localStorage
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  });

  // Load saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    const icon = themeToggleBtn.querySelector('i');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
  }

  // Secure toggle
  secureToggle.addEventListener('change', () => {
    secureSettings.style.display = secureToggle.checked ? 'flex' : 'none';
  });

  // Password strength meter
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const strength = calculatePasswordStrength(password);

    // Update strength bar
    strengthBar.style.width = `${strength}%`;

    // Update color based on strength
    if (strength < 33) {
      strengthBar.style.backgroundColor = 'var(--error-color)';
    } else if (strength < 66) {
      strengthBar.style.backgroundColor = 'var(--warning-color)';
    } else {
      strengthBar.style.backgroundColor = 'var(--success-color)';
    }
  });

  // Save button
  saveBtn.addEventListener('click', async () => {
    const textEditor = document.getElementById('text-editor');
    const syntaxSelect = document.getElementById('syntax-select');
    const expirySelect = document.getElementById('expiry-select');

    const text = textEditor.value.trim();

    if (!text) {
      showNotification('Please enter some text', 'error');
      return;
    }

    // Prepare data
    const data = {
      text,
      syntax: syntaxSelect.value,
      expiration: secureToggle.checked ? expirySelect.value : 'never'
    };

    // Add password if secure toggle is on and password is provided
    if (secureToggle.checked && passwordInput.value) {
      data.password = passwordInput.value;
    }

    try {
      // Show loading state
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

      // Send request to API
      const response = await fetch('/api/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        // Update share URL
        currentTextId = result.id;
        isProtected = result.isProtected;

        const url = `${window.location.origin}/${result.id}`;
        shareUrl.value = url;

        // Show success notification
        showNotification('Text saved successfully!', 'success');

        // Update URL without reloading the page
        window.history.pushState({}, '', `/${result.id}`);

        // Update code display
        codeDisplay.textContent = result.id;

        // Update expiry timer if provided
        if (result.expiresAt) {
          startExpiryTimer(result.expiresAt);
        }

        // Emit text update event for real-time collaboration
        if (window.socket) {
          window.socket.emit('text-update', {
            textId: result.id,
            text: text,
            syntax: syntaxSelect.value
          });
        }

        // Dispatch event for text ID change (for chat.js)
        if (currentTextId !== result.id) {
          const event = new CustomEvent('textIdChanged', {
            detail: { textId: result.id }
          });
          document.dispatchEvent(event);
        }
      } else {
        showNotification(result.message || 'Failed to save text', 'error');
      }
    } catch (error) {
      console.error('Error saving text:', error);
      showNotification('Something went wrong', 'error');
    } finally {
      // Reset button state
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Save & Share';
    }
  });

  // Copy URL button
  copyUrlBtn.addEventListener('click', () => {
    shareUrl.select();
    document.execCommand('copy');

    // Show success notification
    showNotification('URL copied to clipboard!', 'success');
  });

  // QR Code button
  qrCodeBtn.addEventListener('click', () => {
    const url = shareUrl.value;

    // Clear previous QR code
    qrCodeContainer.innerHTML = '';

    // Generate QR code
    QRCode.toCanvas(qrCodeContainer, url, {
      width: 200,
      margin: 1,
      color: {
        dark: document.body.classList.contains('dark-mode') ? '#ffffff' : '#000000',
        light: '#0000'
      }
    }, (error) => {
      if (error) {
        console.error('Error generating QR code:', error);
      }
    });

    // Show modal
    qrModal.style.display = 'flex';
  });

  // Close modals
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      qrModal.style.display = 'none';
      passwordModal.style.display = 'none';
    });
  });

  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === qrModal) {
      qrModal.style.display = 'none';
    }
    if (event.target === passwordModal) {
      passwordModal.style.display = 'none';
    }
  });

  // Copy code button
  copyCodeBtn.addEventListener('click', () => {
    // Create a temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = codeDisplay.textContent;
    document.body.appendChild(tempInput);

    // Select and copy the text
    tempInput.select();
    document.execCommand('copy');

    // Remove the temporary element
    document.body.removeChild(tempInput);

    // Show success notification
    showNotification('Code copied to clipboard!', 'success');
  });

  // Load code button
  loadCodeBtn.addEventListener('click', () => {
    const code = codeInput.value.trim();

    if (!code) {
      showNotification('Please enter a code', 'error');
      return;
    }

    // Load text by code
    loadText(code);

    // Clear input
    codeInput.value = '';
  });

  // Load code on Enter key
  codeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loadCodeBtn.click();
    }
  });

  // Submit password
  submitPassword.addEventListener('click', async () => {
    const password = passwordPrompt.value;

    if (!password) {
      passwordError.textContent = 'Please enter a password';
      return;
    }

    try {
      // Show loading state
      submitPassword.disabled = true;
      submitPassword.textContent = 'Verifying...';

      // Get text with password
      await loadText(currentTextId, password);

      // Close modal if successful
      passwordModal.style.display = 'none';

      // Clear password field
      passwordPrompt.value = '';
      passwordError.textContent = '';
    } catch (error) {
      passwordError.textContent = 'Invalid password';
    } finally {
      // Reset button state
      submitPassword.disabled = false;
      submitPassword.textContent = 'Submit';
    }
  });

  // Check if URL contains a text ID
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    const textId = pathSegments[0];
    currentTextId = textId;

    // Load text
    loadText(textId);
  }

  // Helper functions

  // Generate a default share URL
  async function generateDefaultShareUrl() {
    try {
      // Create an empty text snippet
      const response = await fetch('/api/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: ' ', // Placeholder text
          syntax: 'plain',
          expiration: '10m' // Short expiration for placeholder
        })
      });

      const result = await response.json();

      if (result.success) {
        // Set the current text ID
        currentTextId = result.id;

        // Update share URL
        const url = `${window.location.origin}/${result.id}`;
        shareUrl.value = url;

        // Update code display
        codeDisplay.textContent = result.id;

        // Update expiry timer if provided
        if (result.expiresAt) {
          startExpiryTimer(result.expiresAt);
        }

        // Dispatch event for text ID change (for chat.js)
        const event = new CustomEvent('textIdChanged', {
          detail: { textId: result.id }
        });
        document.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error generating default share URL:', error);
    }
  }

  // Load text by ID
  async function loadText(id, password = null) {
    try {
      // Prepare URL
      let url = `/api/text/${id}`;
      if (password) {
        url += `?password=${encodeURIComponent(password)}`;
      }

      // Send request to API
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        // Update editor
        const textEditor = document.getElementById('text-editor');
        const syntaxSelect = document.getElementById('syntax-select');

        textEditor.value = result.text;
        syntaxSelect.value = result.syntax || 'plain';

        // Update preview if needed
        updatePreview();

        // Update share URL
        shareUrl.value = `${window.location.origin}/${id}`;

        // Update URL without reloading the page
        window.history.pushState({}, '', `/${id}`);

        // Update code display
        codeDisplay.textContent = id;

        // Update current text ID
        if (currentTextId !== id) {
          currentTextId = id;

          // Dispatch event for text ID change (for chat.js)
          const event = new CustomEvent('textIdChanged', {
            detail: { textId: id }
          });
          document.dispatchEvent(event);
        }

        // Update expiry timer
        if (result.expiresAt) {
          startExpiryTimer(result.expiresAt);
        } else {
          clearExpiryTimer();
          expiryTimerDisplay.textContent = '--:--';
        }

        // Enable socket.io real-time updates
        if (window.socket) {
          window.socket.emit('join', id);
        }
      } else if (result.isProtected) {
        // Show password modal
        passwordModal.style.display = 'flex';
        passwordPrompt.focus();
      } else {
        showNotification(result.message || 'Failed to load text', 'error');
      }
    } catch (error) {
      console.error('Error loading text:', error);
      showNotification('Something went wrong', 'error');
      throw error;
    }
  }

  // Calculate password strength (0-100)
  function calculatePasswordStrength(password) {
    if (!password) return 0;

    let strength = 0;

    // Length contribution (up to 40%)
    strength += Math.min(password.length * 4, 40);

    // Character variety contribution (up to 60%)
    if (/[a-z]/.test(password)) strength += 10; // lowercase
    if (/[A-Z]/.test(password)) strength += 10; // uppercase
    if (/[0-9]/.test(password)) strength += 10; // numbers
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15; // special chars
    if (/(.)\1\1/.test(password)) strength -= 10; // repeated chars penalty

    return Math.max(0, Math.min(100, strength));
  }

  // Start expiry timer
  function startExpiryTimer(expiryTime) {
    // Clear any existing timer
    clearExpiryTimer();

    // Set expiry timestamp
    expiryTimestamp = expiryTime;

    // Update timer immediately
    updateExpiryTimer();

    // Set interval to update timer every second
    expiryTimerId = setInterval(updateExpiryTimer, 1000);
  }

  // Clear expiry timer
  function clearExpiryTimer() {
    if (expiryTimerId) {
      clearInterval(expiryTimerId);
      expiryTimerId = null;
    }
  }

  // Update expiry timer display
  function updateExpiryTimer() {
    if (!expiryTimestamp) {
      expiryTimerDisplay.textContent = '--:--';
      return;
    }

    const now = Date.now();
    const timeLeft = expiryTimestamp - now;

    if (timeLeft <= 0) {
      // Text has expired
      clearExpiryTimer();
      expiryTimerDisplay.textContent = 'Expired';
      expiryTimerDisplay.style.color = 'var(--error-color)';

      // Show notification
      showNotification('This text has expired', 'error');

      return;
    }

    // Reset color if needed
    expiryTimerDisplay.style.color = '';

    // Format time left
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    expiryTimerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Show notification
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to document
    document.body.appendChild(notification);

    // Show with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
});

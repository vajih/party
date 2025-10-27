/**
 * Help Guides and Tooltips for non-tech-savvy users
 */

export function createHelpIcon(tooltipText) {
  return `<span class="tooltip">
    <span class="help-icon">?</span>
    <span class="tooltip-text">${tooltipText}</span>
  </span>`;
}

export function createInfoBanner(title, description, type = 'info') {
  return `<div class="info-banner ${type}">
    <div class="icon">${type === 'success' ? '✓' : 'ℹ️'}</div>
    <div class="content">
      <div class="title">${title}</div>
      <div class="description">${description}</div>
    </div>
  </div>`;
}

export function createStepGuide(title, steps) {
  const stepsHtml = steps.map((step, index) => `
    <div class="step">
      <div class="step-number">${index + 1}</div>
      <div class="step-content">
        <div class="step-title">${step.title}</div>
        <div class="step-description">${step.description}</div>
      </div>
    </div>
  `).join('');

  return `<div class="step-guide">
    <div class="title">${title}</div>
    <div class="steps">${stepsHtml}</div>
  </div>`;
}

export function createQuickTip(text) {
  return `<div class="quick-tip">${text}</div>`;
}

export function createDismissibleBanner(id, title, description) {
  const dismissed = localStorage.getItem(`banner-dismissed-${id}`);
  if (dismissed) return '';

  setTimeout(() => {
    const banner = document.querySelector(`[data-banner-id="${id}"]`);
    if (banner) {
      const closeBtn = banner.querySelector('.close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          localStorage.setItem(`banner-dismissed-${id}`, 'true');
          banner.style.animation = 'slideUp 0.3s ease-out';
          setTimeout(() => banner.remove(), 300);
        });
      }
    }
  }, 100);

  return `<div class="info-banner dismissible-banner" data-banner-id="${id}">
    <div class="icon">👋</div>
    <div class="content">
      <div class="title">${title}</div>
      <div class="description">${description}</div>
    </div>
    <button class="close-btn" aria-label="Dismiss">×</button>
  </div>`;
}

// Guest-specific help content
export const HELP_CONTENT = {
  welcome: {
    title: "Welcome! Here's how to join",
    steps: [
      {
        title: "Enter your email",
        description: "Type your email address in the box below. We'll send you a special link to join the party."
      },
      {
        title: "Check your inbox",
        description: "Look for an email from us (check spam folder if you don't see it!)."
      },
      {
        title: "Click the magic link",
        description: "Click the link in the email to instantly join the party - no password needed!"
      }
    ]
  },
  
  babyPhoto: {
    banner: {
      title: "How to Submit Your Baby Photo",
      description: "Tap 'Choose Photo' below, select a cute baby picture from your device, and hit 'Submit Photo'. Your photo will be reviewed by the host before appearing in the gallery."
    },
    fileInput: "Tap here to pick a photo from your phone or computer",
    photoInfo: "Optional: Add details like 'Age 6 months' or 'Summer 1995' to help others identify your photo"
  },

  favoriteSong: {
    banner: {
      title: "Share Your Favorite Song",
      description: "Tell us about a song you love! Fill in the song title and artist name. You can also paste a YouTube or Spotify link so others can listen."
    },
    voting: "You can vote for up to 5 songs you like! Click 'Vote' on your favorites. Click again to remove your vote."
  },

  aboutYou: {
    banner: {
      title: "Tell Us About Yourself",
      description: "Answer the fun questions below! The host created these questions to help everyone get to know each other better."
    }
  },

  general: {
    signIn: "We use email 'magic links' instead of passwords - it's easier and more secure! Just click the link we email you.",
    moderation: "Your submission will be reviewed by the party host before it appears publicly. This usually takes just a few minutes!",
    optional: "This field is optional - you can leave it blank if you prefer."
  }
};

/**
 * Question Renderer for About You Extended Questions
 * Handles different question types: either_or, single_choice, short_text
 */

import { QUESTION_BATCHES, getBatch, isBatchLocked, calculateProgress } from './questions-config.js';

const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render an either_or question (A vs B with optional Both/Neither)
 */
function renderEitherOrQuestion(question, currentAnswer = null) {
  const { id, prompt, options, required, flags = {}, sensitive, helpText } = question;
  const allowBoth = flags.allow_both ?? false;
  const allowNeither = flags.allow_neither ?? false;
  const allowDontKnow = flags.allow_dont_know ?? false;
  
  // Parse current answer
  let selectedOptions = [];
  if (currentAnswer) {
    if (typeof currentAnswer === 'string') {
      selectedOptions = currentAnswer.split(',');
    } else if (Array.isArray(currentAnswer)) {
      selectedOptions = currentAnswer;
    }
  }

  const optionA = options[0];
  const optionB = options[1];

  return `
    <div class="question-card either-or" data-question-id="${id}">
      <div class="question-header">
        <div class="question-prompt">
          ${escapeHtml(prompt)}
          ${required ? '<span class="required">*</span>' : ''}
        </div>
        ${sensitive ? '<div class="privacy-badge">🔒 Private answer</div>' : ''}
        ${helpText ? `<div class="help-text">${escapeHtml(helpText)}</div>` : ''}
      </div>
      
      <div class="either-or-buttons">
        <button 
          type="button" 
          class="option-btn option-a ${selectedOptions.includes(optionA.id) ? 'selected' : ''}"
          data-option="${optionA.id}"
          data-exclusive="${!allowBoth}">
          <span class="option-label">${escapeHtml(optionA.label)}</span>
          <span class="check-icon">✓</span>
        </button>
        
        <button 
          type="button" 
          class="option-btn option-b ${selectedOptions.includes(optionB.id) ? 'selected' : ''}"
          data-option="${optionB.id}"
          data-exclusive="${!allowBoth}">
          <span class="option-label">${escapeHtml(optionB.label)}</span>
          <span class="check-icon">✓</span>
        </button>
      </div>

      ${allowBoth || allowNeither || allowDontKnow ? `
        <div class="modifier-buttons">
          ${allowBoth ? `
            <button 
              type="button" 
              class="modifier-btn both-btn ${selectedOptions.includes('BOTH') ? 'active' : ''}"
              data-modifier="BOTH">
              Both! 🤝
            </button>
          ` : ''}
          ${allowNeither ? `
            <button 
              type="button" 
              class="modifier-btn neither-btn ${selectedOptions.includes('NEITHER') ? 'active' : ''}"
              data-modifier="NEITHER">
              Neither 🤷
            </button>
          ` : ''}
          ${allowDontKnow ? `
            <button 
              type="button" 
              class="modifier-btn dont-know-btn ${selectedOptions.includes('DONT_KNOW') ? 'active' : ''}"
              data-modifier="DONT_KNOW">
              What's the diff? 🤔
            </button>
          ` : ''}
        </div>
      ` : ''}
      
      <input type="hidden" name="${id}" value="${escapeHtml(selectedOptions.join(','))}">
    </div>
  `;
}

/**
 * Render a single_choice question (radio buttons or cards)
 */
function renderSingleChoiceQuestion(question, currentAnswer = null) {
  const { id, prompt, options, required } = question;
  
  const hasWriteIn = options.some(opt => opt.write_in);
  const writeInValue = currentAnswer && currentAnswer.startsWith('X:') ? currentAnswer.substring(2) : '';
  
  return `
    <div class="question-card single-choice" data-question-id="${id}">
      <div class="question-header">
        <div class="question-prompt">
          ${escapeHtml(prompt)}
          ${required ? '<span class="required">*</span>' : ''}
        </div>
      </div>
      
      <div class="single-choice-options">
        ${options.map(option => `
          <button 
            type="button" 
            class="choice-btn ${currentAnswer === option.id ? 'selected' : ''}"
            data-option="${option.id}"
            ${option.write_in ? 'data-write-in="true"' : ''}>
            <span class="radio-indicator"></span>
            <span class="choice-label">${escapeHtml(option.label)}</span>
            <span class="check-icon">✓</span>
          </button>
        `).join('')}
      </div>

      ${hasWriteIn ? `
        <div class="write-in-container" style="${currentAnswer && currentAnswer.startsWith('X:') ? '' : 'display: none;'}">
          <input 
            type="text" 
            class="write-in-input" 
            placeholder="Who were you thinking...?"
            value="${escapeHtml(writeInValue)}"
            maxlength="50">
        </div>
      ` : ''}
      
      <input type="hidden" name="${id}" value="${escapeHtml(currentAnswer || '')}">
    </div>
  `;
}

/**
 * Render a dropdown question (select element)
 */
function renderDropdownQuestion(question, currentAnswer = null) {
  const { id, prompt, required, options } = question;
  
  return `
    <div class="question-card dropdown" data-question-id="${id}">
      <div class="question-header">
        <label for="select_${id}" class="question-prompt">
          ${escapeHtml(prompt)}
          ${required ? '<span class="required">*</span>' : ''}
        </label>
      </div>
      
      <select 
        id="select_${id}"
        name="${id}"
        class="dropdown-select"
        ${required ? 'required' : ''}>
        <option value="">Select an option...</option>
        ${options.map(opt => `
          <option value="${opt.id}" ${currentAnswer === opt.id ? 'selected' : ''}>
            ${escapeHtml(opt.label)}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

/**
 * Render a short_text question (text input)
 */
function renderShortTextQuestion(question, currentAnswer = null) {
  const { id, prompt, required, placeholder = '' } = question;
  
  return `
    <div class="question-card short-text" data-question-id="${id}">
      <div class="question-header">
        <label for="input_${id}" class="question-prompt">
          ${escapeHtml(prompt)}
          ${required ? '<span class="required">*</span>' : ''}
        </label>
      </div>
      
      <input 
        type="text" 
        id="input_${id}"
        name="${id}"
        class="text-input-answer"
        placeholder="${escapeHtml(placeholder)}"
        value="${escapeHtml(currentAnswer || '')}"
        ${required ? 'required' : ''}
        maxlength="100">
      
      <div class="char-count">
        <span class="current">${currentAnswer?.length || 0}</span> / 100
      </div>
    </div>
  `;
}

/**
 * Render a photo upload question
 */
function renderPhotoUploadQuestion(question, currentAnswer = null) {
  const { id, prompt, required, instructions } = question;
  
  return `
    <div class="question-card photo-upload" data-question-id="${id}">
      <div class="question-header">
        <label for="input_${id}" class="question-prompt">
          ${escapeHtml(prompt)}
          ${required ? '<span class="required">*</span>' : ''}
        </label>
        ${instructions ? `<p class="photo-instructions">${escapeHtml(instructions)}</p>` : ''}
      </div>
      
      <div class="photo-upload-container">
        <input 
          type="file" 
          id="input_${id}"
          name="${id}"
          class="photo-input"
          accept="image/*"
          ${required ? 'required' : ''}
          style="display: none;">
        
        <div class="photo-preview" id="preview_${id}" style="display: none;">
          <img src="" alt="Preview" class="preview-image">
          <button type="button" class="remove-photo" data-input-id="input_${id}">
            <span>×</span> Remove
          </button>
        </div>
        
        <button type="button" class="photo-upload-btn" data-input-id="input_${id}">
          📷 Choose Photo
        </button>
        
        <p class="photo-hint">Recommended: Clear photo of you as a baby or toddler</p>
      </div>
    </div>
  `;
}

/**
 * Render a question based on its type
 */
export function renderQuestion(question, currentAnswer = null) {
  switch (question.kind) {
    case 'either_or':
      return renderEitherOrQuestion(question, currentAnswer);
    case 'single_choice':
      return renderSingleChoiceQuestion(question, currentAnswer);
    case 'dropdown':
      return renderDropdownQuestion(question, currentAnswer);
    case 'short_text':
      return renderShortTextQuestion(question, currentAnswer);
    case 'photo_upload':
      return renderPhotoUploadQuestion(question, currentAnswer);
    default:
      return `<div class="error">Unknown question type: ${question.kind}</div>`;
  }
}

/**
 * Render all questions for a batch
 */
export function renderBatchQuestions(batchId, answers = {}) {
  const batch = getBatch(batchId);
  if (!batch) return '<div class="error">Batch not found</div>';

  return batch.questions.map(q => renderQuestion(q, answers[q.id])).join('\n');
}

/**
 * Wire up event handlers for either_or questions
 */
function bindEitherOrHandlers(container) {
  const cards = qsa('.either-or', container);
  
  cards.forEach(card => {
    const hiddenInput = qs('input[type="hidden"]', card);
    const optionButtons = qsa('.option-btn', card);
    const modifierButtons = qsa('.modifier-btn', card);
    
    const updateHiddenInput = () => {
      const selected = qsa('.option-btn.selected', card).map(btn => btn.dataset.option);
      const modifiers = qsa('.modifier-btn.active', card).map(btn => btn.dataset.modifier);
      hiddenInput.value = [...selected, ...modifiers].join(',');
    };
    
    optionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const isExclusive = btn.dataset.exclusive === 'true';
        
        if (isExclusive) {
          // Deselect other option button
          optionButtons.forEach(b => {
            if (b !== btn) b.classList.remove('selected');
          });
        }
        
        btn.classList.toggle('selected');
        
        // Clear modifiers when selecting options
        modifierButtons.forEach(mb => mb.classList.remove('active'));
        
        updateHiddenInput();
      });
    });
    
    modifierButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Deselect option buttons
        optionButtons.forEach(ob => ob.classList.remove('selected'));
        
        // Toggle this modifier (and deselect other)
        const wasActive = btn.classList.contains('active');
        modifierButtons.forEach(mb => mb.classList.remove('active'));
        if (!wasActive) btn.classList.add('active');
        
        updateHiddenInput();
      });
    });
  });
}

/**
 * Wire up event handlers for single_choice questions
 */
function bindSingleChoiceHandlers(container) {
  const cards = qsa('.single-choice', container);
  
  cards.forEach(card => {
    const hiddenInput = qs('input[type="hidden"]', card);
    const choiceButtons = qsa('.choice-btn', card);
    const writeInContainer = qs('.write-in-container', card);
    const writeInInput = qs('.write-in-input', card);
    
    choiceButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Deselect all
        choiceButtons.forEach(b => b.classList.remove('selected'));
        
        // Select clicked
        btn.classList.add('selected');
        
        const optionId = btn.dataset.option;
        const isWriteIn = btn.dataset.writeIn === 'true';
        
        if (isWriteIn && writeInContainer) {
          writeInContainer.style.display = 'block';
          writeInInput?.focus();
          hiddenInput.value = `X:${writeInInput?.value || ''}`;
        } else {
          if (writeInContainer) writeInContainer.style.display = 'none';
          hiddenInput.value = optionId;
        }
      });
    });
    
    // Handle write-in input changes
    if (writeInInput) {
      writeInInput.addEventListener('input', () => {
        hiddenInput.value = `X:${writeInInput.value}`;
      });
    }
  });
}

/**
 * Wire up event handlers for dropdown questions
 */
function bindDropdownHandlers(container) {
  const cards = qsa('.dropdown', container);
  
  cards.forEach(card => {
    const selectElement = qs('.dropdown-select', card);
    
    if (selectElement) {
      // No special handling needed - standard select behavior
      // Just ensure proper validation styling
      selectElement.addEventListener('change', () => {
        if (selectElement.value) {
          selectElement.classList.add('has-value');
        } else {
          selectElement.classList.remove('has-value');
        }
      });
      
      // Initialize state
      if (selectElement.value) {
        selectElement.classList.add('has-value');
      }
    }
  });
}

/**
 * Wire up event handlers for short_text questions
 */
function bindShortTextHandlers(container) {
  const cards = qsa('.short-text', container);
  
  cards.forEach(card => {
    const textInput = qs('.text-input-answer', card);
    const charCount = qs('.char-count .current', card);
    
    if (textInput && charCount) {
      textInput.addEventListener('input', () => {
        charCount.textContent = textInput.value.length;
      });
    }
  });
}

/**
 * Wire up event handlers for photo upload questions
 */
function bindPhotoUploadHandlers(container) {
  const cards = qsa('.photo-upload', container);
  
  cards.forEach(card => {
    const fileInput = qs('.photo-input', card);
    const uploadBtn = qs('.photo-upload-btn', card);
    const preview = qs('.photo-preview', card);
    const previewImg = qs('.preview-image', card);
    const removeBtn = qs('.remove-photo', card);
    
    if (!fileInput || !uploadBtn) return;
    
    // Click upload button to trigger file input
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          previewImg.src = event.target.result;
          preview.style.display = 'block';
          uploadBtn.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Handle photo removal
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        fileInput.value = '';
        previewImg.src = '';
        preview.style.display = 'none';
        uploadBtn.style.display = 'block';
      });
    }
  });
}

/**
 * Wire up all question handlers
 */
export function bindQuestionHandlers(container) {
  bindEitherOrHandlers(container);
  bindSingleChoiceHandlers(container);
  bindDropdownHandlers(container);
  bindShortTextHandlers(container);
  bindPhotoUploadHandlers(container);
}

/**
 * Extract answers from the form
 */
export function extractAnswers(container) {
  const answers = {};
  const inputs = qsa('input[type="hidden"], input.text-input-answer, select.dropdown-select', container);
  
  inputs.forEach(input => {
    if (input.name && input.value) {
      answers[input.name] = input.value;
    }
  });
  
  // Handle photo uploads - store file reference
  const photoInputs = qsa('input.photo-input', container);
  photoInputs.forEach(input => {
    if (input.name && input.files && input.files.length > 0) {
      answers[input.name] = 'photo_uploaded'; // Flag that photo exists
      answers[`${input.name}_file`] = input.files[0]; // Store file reference
    }
  });
  
  return answers;
}

/**
 * Validate required questions
 */
export function validateBatch(batchId, answers) {
  const batch = getBatch(batchId);
  if (!batch) return { valid: false, message: 'Batch not found' };
  
  const requiredQuestions = batch.questions.filter(q => q.required);
  const missingAnswers = requiredQuestions.filter(q => !answers[q.id] || answers[q.id] === '');
  
  if (missingAnswers.length > 0) {
    return {
      valid: false,
      message: `Please answer all required questions (${missingAnswers.length} remaining)`
    };
  }
  
  return { valid: true };
}

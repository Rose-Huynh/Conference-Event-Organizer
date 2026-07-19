const storedSessions = localStorage.getItem('techconnectSessions');
let sessions = storedSessions ? JSON.parse(storedSessions).map(normalizeSession) : [];

function normalizeSession(session) {
  return {
    sessionId: session.sessionId || session.productId || '',
    title: session.title || session.description || '',
    type: session.type || session.category || '',
    format: session.format || session.unitOfMeasure || '',
    price: Number(session.price || 0).toFixed(2),
    description: session.description || session.title || 'N/A',
    additionalInfo: session.additionalInfo || 'N/A'
  };
}

function saveSessions() {
  localStorage.setItem('techconnectSessions', JSON.stringify(sessions, null, 2));
}

function showError(fieldId, errorId, show) {
  const field = $('#' + fieldId);
  const error = $('#' + errorId);

  if (show) {
    field.addClass('input-error').removeClass('input-success');
    error.addClass('show');
  } else {
    field.removeClass('input-error');
    error.removeClass('show');

    if (field.val().trim() !== '') {
      field.addClass('input-success');
    }
  }

  return !show;
}

function validateSessionForm() {
  const sessionId = $('#sessionId').val().trim();
  const sessionTitle = $('#sessionTitle').val().trim();
  const sessionCategory = $('#sessionCategory').val();
  const sessionUnit = $('#sessionUnit').val();
  const sessionPrice = $('#sessionPrice').val().trim();

  let valid = true;

  valid = showError('sessionId', 'sessionIdErr', sessionId === '') && valid;
  valid = showError('sessionTitle', 'sessionTitleErr', sessionTitle === '') && valid;
  valid = showError('sessionCategory', 'sessionCategoryErr', sessionCategory === '') && valid;
  valid = showError('sessionUnit', 'sessionUnitErr', sessionUnit === '') && valid;
  valid = showError(
    'sessionPrice',
    'sessionPriceErr',
    sessionPrice === '' || isNaN(sessionPrice) || Number(sessionPrice) < 0
  ) && valid;

  return valid;
}

function submitSession(event) {
  event.preventDefault();

  if (!validateSessionForm()) return;

  const editIndex = parseInt($('#editIndex').val(), 10);
  const sessionTitle = $('#sessionTitle').val().trim();

  const sessionEntry = {
    sessionId: $('#sessionId').val().trim(),
    title: sessionTitle,
    type: $('#sessionCategory').val(),
    format: $('#sessionUnit').val(),
    price: Number($('#sessionPrice').val()).toFixed(2),
    description: sessionTitle,
    additionalInfo: $('#sessionInfo').val().trim() || 'N/A'
  };

  if (editIndex >= 0) {
    sessions[editIndex] = sessionEntry;
  } else {
    sessions.push(sessionEntry);
  }

  saveSessions();
  renderSessions(sessions);
  renderJSON(sessions);
  resetForm();
  showToast();
}

function renderSessions(data) {
  $('#countBadge').text(data.length + ' sessions');

  if (data.length === 0) {
    $('#sessionTable').html(`
      <tr>
        <td colspan="7" class="text-center text-muted py-4">No matching sessions found.</td>
      </tr>
    `);
    return;
  }

  const rows = data.map((session) => {
    const originalIndex = sessions.findIndex(item => item.sessionId === session.sessionId);

    return `
      <tr>
        <td><strong>${session.sessionId}</strong></td>
        <td>${session.title}</td>
        <td><span class="badge-type">${session.type}</span></td>
        <td>${session.format}</td>
        <td>$${session.price}</td>
        <td>${session.additionalInfo || 'N/A'}</td>
        <td>
          <button class="btn-edit me-1" type="button" data-index="${originalIndex}">Edit</button>
          <button class="btn-delete" type="button" data-index="${originalIndex}">Delete</button>
        </td>
      </tr>
    `;
  }).join('');

  $('#sessionTable').html(rows);
}

function renderJSON(data) {
  $('#jsonPreview').text(JSON.stringify(data, null, 2));
}

function searchSessions() {
  const searchTerm = $('#searchInput').val().toLowerCase();

  const filteredSessions = sessions.filter(session => {
    return (
      (session.sessionId || '').toLowerCase().includes(searchTerm) ||
      (session.title || '').toLowerCase().includes(searchTerm) ||
      (session.type || '').toLowerCase().includes(searchTerm) ||
      (session.format || '').toLowerCase().includes(searchTerm) ||
      (session.description || '').toLowerCase().includes(searchTerm) ||
      (session.additionalInfo || '').toLowerCase().includes(searchTerm)
    );
  });

  renderSessions(filteredSessions);
  renderJSON(filteredSessions);
}

function editSession(index) {
  const session = sessions[index];

  $('#sessionId').val(session.sessionId);
  $('#sessionTitle').val(session.title);
  $('#sessionCategory').val(session.type);
  $('#sessionUnit').val(session.format);
  $('#sessionPrice').val(session.price);
  $('#sessionInfo').val(session.additionalInfo === 'N/A' ? '' : session.additionalInfo);

  $('#editIndex').val(index);
  $('#formTitle').text('Update Session');
  $('#saveSession').text('Update Session');

  $('.error-msg').removeClass('show');
  $('.form-control, .form-select').removeClass('input-error').addClass('input-success');

  $('html, body').animate({ scrollTop: 0 }, 400);
}

function deleteSession(index) {
  if (confirm('Remove this session?')) {
    sessions.splice(index, 1);
    saveSessions();
    renderSessions(sessions);
    renderJSON(sessions);
  }
}

function resetForm() {
  $('#editIndex').val('-1');
  $('#sessionForm')[0].reset();

  $('#formTitle').text('Add Session');
  $('#saveSession').text('Save Session');

  $('.error-msg').removeClass('show');
  $('.form-control, .form-select').removeClass('input-error input-success');
}

function showToast() {
  $('#successToast').fadeIn(200);

  setTimeout(() => {
    $('#successToast').fadeOut(200);
  }, 2500);
}

function initializeSessionPage() {
  if (storedSessions === null) {
    $.getJSON('../data/sessions.json')
      .done(function (data) {
        sessions = data.map(normalizeSession);
        saveSessions();
        renderSessions(sessions);
        renderJSON(sessions);
      })
      .fail(function () {
        renderSessions(sessions);
        renderJSON(sessions);
      });
  } else {
    saveSessions();
    renderSessions(sessions);
    renderJSON(sessions);
  }
}

$(document).ready(function () {
  initializeSessionPage();

  $('#sessionForm').on('submit', submitSession);

  $('#clearSession').on('click', function () {
    resetForm();
  });

  $('#searchInput').on('keyup', function () {
    searchSessions();
  });

  $('#sessionTable').on('click', '.btn-edit', function () {
    const index = parseInt($(this).data('index'), 10);
    editSession(index);
  });

  $('#sessionTable').on('click', '.btn-delete', function () {
    const index = parseInt($(this).data('index'), 10);
    deleteSession(index);
  });
});
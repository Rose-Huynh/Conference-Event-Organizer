const sessionsEndpoint = '/api/sessions';
let sessions = [];

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

  const originalSessionId = editIndex >= 0 ? sessions[editIndex].sessionId : null;

  const sessionEntry = {
    sessionId: editIndex >= 0 ? originalSessionId : $('#sessionId').val().trim(),
    title: sessionTitle,
    type: $('#sessionCategory').val(),
    format: $('#sessionUnit').val(),
    price: Number($('#sessionPrice').val()).toFixed(2),
    description: sessionTitle,
    additionalInfo: $('#sessionInfo').val().trim() || 'N/A'
  };

  const requestMethod = editIndex >= 0 ? 'PUT' : 'POST';
  const requestUrl = editIndex >= 0
    ? sessionsEndpoint + '/' + encodeURIComponent(originalSessionId)
    : sessionsEndpoint;

  $.ajax({
    url: requestUrl,
    method: requestMethod,
    contentType: 'application/json',
    data: JSON.stringify(sessionEntry),
    success: function () {
      initializeSessionPage();
      resetForm();
      showToast();
    },
    error: function () {
      alert('Session could not be saved to the Node API.');
    }
  });
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

  const rows = data.map(function (session) {
    const originalIndex = sessions.findIndex(function (item) {
      return item.sessionId === session.sessionId;
    });

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

  const filteredSessions = sessions.filter(function (session) {
    return (
      String(session.sessionId || '').toLowerCase().includes(searchTerm) ||
      String(session.title || '').toLowerCase().includes(searchTerm) ||
      String(session.type || '').toLowerCase().includes(searchTerm) ||
      String(session.format || '').toLowerCase().includes(searchTerm) ||
      String(session.description || '').toLowerCase().includes(searchTerm) ||
      String(session.additionalInfo || '').toLowerCase().includes(searchTerm)
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
  const session = sessions[index];

  if (confirm('Remove this session?')) {
    $.ajax({
      url: sessionsEndpoint + '/' + encodeURIComponent(session.sessionId),
      method: 'DELETE',
      success: function () {
        initializeSessionPage();
      },
      error: function () {
        alert('Session could not be deleted from the Node API.');
      }
    });
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

  setTimeout(function () {
    $('#successToast').fadeOut(200);
  }, 2500);
}

function initializeSessionPage() {
  $.getJSON(sessionsEndpoint)
    .done(function (data) {
      sessions = data.map(normalizeSession);
      renderSessions(sessions);
      renderJSON(sessions);
    })
    .fail(function () {
      renderSessions(sessions);
      renderJSON(sessions);
      alert('Could not load sessions from the Node API.');
    });
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
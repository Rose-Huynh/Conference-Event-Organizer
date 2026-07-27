const returnsEndpoint = '/api/returns';
const productsEndpoint = '/api/products';
let productItems = [];
let returnRequests = [];

function money(value) {
  return '$' + Number(value || 0).toFixed(2);
}

function loadCartItemsFallback() {
  const savedItems = JSON.parse(localStorage.getItem('techconnectCart')) || [];

  return savedItems.map(function (item) {
    return {
      productId: item.productId || 'N/A',
      name: item.name || item.description || 'Unnamed Product',
      category: item.category || 'Cart Item',
      price: Number(item.price || 0).toFixed(2)
    };
  });
}

function normalizeProductItem(item) {
  return {
    productId: item.productId || item.id || 'N/A',
    name: item.name || item.description || 'Unnamed Product',
    category: item.category || 'N/A',
    price: Number(item.price || 0).toFixed(2)
  };
}

function buildReturnDocument() {
  return {
    returnId: 'RET-' + Date.now(),
    productId: $('#productItem').val() || 'N/A',
    productName: $('#productName').val().trim(),
    price: Number($('#price').val() || 0).toFixed(2),
    reason: $('#reason').val(),
    condition: $('#condition').val(),
    notes: $('#notes').val().trim() || 'N/A'
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

function validateReturnForm() {
  const returnDocument = buildReturnDocument();
  let valid = true;

  valid = showError('productItem', 'productItemErr', $('#productItem').val() === '') && valid;
  valid = showError('productName', 'productNameErr', returnDocument.productName === '') && valid;
  valid = showError('price', 'priceErr', Number(returnDocument.price) <= 0) && valid;
  valid = showError('reason', 'reasonErr', returnDocument.reason === '') && valid;
  valid = showError('condition', 'conditionErr', returnDocument.condition === '') && valid;

  return valid;
}

function renderProductItemOptions() {
  const options = productItems.map(function (item) {
    return `<option value="${item.productId}">${item.name} - ${money(item.price)}</option>`;
  }).join('');

  $('#productItem').html('<option value="">Select product from items list</option>' + options);
}

function selectProductItem(productId) {
  const selectedItem = productItems.find(function (item) {
    return String(item.productId) === String(productId);
  });

  if (!selectedItem) {
    $('#productItem').val('');
    $('#productName').val('');
    $('#price').val('');
    renderReturnPreview();
    return;
  }

  $('#productItem').val(selectedItem.productId);
  $('#productName').val(selectedItem.name);
  $('#price').val(selectedItem.price);
  $('#productItem, #productName, #price').removeClass('input-error').addClass('input-success');
  $('#productItemErr, #productNameErr, #priceErr').removeClass('show');
  renderReturnPreview();
}

function loadProductItems() {
  $.getJSON(productsEndpoint)
    .done(function (data) {
      productItems = data.map(normalizeProductItem);
      renderProductItemOptions();
    })
    .fail(function () {
      productItems = loadCartItemsFallback();
      renderProductItemOptions();
      setApiStatus('Could not load products from the Node API. Showing saved cart items instead.', 'text-danger');
    });
}

function renderReturnRequests() {
  $('#returnCount').text(returnRequests.length + ' requests');

  if (returnRequests.length === 0) {
    $('#returnTable').html('<tr><td colspan="5" class="text-center text-muted py-4">No return requests submitted yet.</td></tr>');
    return;
  }

  const rows = returnRequests.map(function (request) {
    return `
      <tr>
        <td>${request.productName}</td>
        <td>${money(request.price)}</td>
        <td>${request.reason}</td>
        <td>${request.condition}</td>
        <td><span class="badge-type">${request.status || 'Pending'}</span></td>
      </tr>
    `;
  }).join('');

  $('#returnTable').html(rows);
}

function renderReturnPreview() {
  $('#returnJsonPreview').text(JSON.stringify(buildReturnDocument(), null, 2));
}

function showToast() {
  $('#successToast').fadeIn(200);

  setTimeout(function () {
    $('#successToast').fadeOut(200);
  }, 2500);
}

function setApiStatus(message, statusClass) {
  $('#apiStatus')
    .removeClass('text-muted text-success text-danger')
    .addClass(statusClass)
    .text(message);
}

function loadReturnRequests() {
  $.getJSON(returnsEndpoint)
    .done(function (data) {
      returnRequests = data;
      renderReturnRequests();
    })
    .fail(function () {
      returnRequests = [];
      renderReturnRequests();
      setApiStatus('Could not load return requests from the Node API.', 'text-danger');
    });
}

function submitReturn(event) {
  event.preventDefault();
  renderReturnPreview();

  if (!validateReturnForm()) {
    setApiStatus('Please fix the form errors before submitting.', 'text-danger');
    return;
  }

  setApiStatus('Sending return JSON to the Node REST API...', 'text-muted');

  $.ajax({
    url: returnsEndpoint,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(buildReturnDocument()),
    success: function (response) {
      setApiStatus(response.message || 'Return request submitted successfully.', 'text-success');
      loadReturnRequests();
      showToast();
    },
    error: function () {
      setApiStatus('Return request could not be sent to the Node REST API.', 'text-danger');
    }
  });
}

function resetReturnForm() {
  $('#returnForm')[0].reset();
  $('.error-msg').removeClass('show');
  $('.form-control, .form-select').removeClass('input-error input-success');
  setApiStatus('No API request sent yet.', 'text-muted');
  renderReturnPreview();
}

$(document).ready(function () {
  loadProductItems();
  loadReturnRequests();
  renderReturnPreview();

  $('#productItem').on('change', function () {
    selectProductItem($(this).val());
  });

  $('#returnForm').on('submit', submitReturn);
  $('#clearReturn').on('click', resetReturnForm);
  $('#returnForm input, #returnForm select, #returnForm textarea').on('input change', renderReturnPreview);
});

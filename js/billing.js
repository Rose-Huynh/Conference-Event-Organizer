const billingEndpoint = '/api/billing';
const billingDetailsSeedEndpoint = '../data/billing-details.json';
let cartItems = [];

function money(value) {
  return '$' + Number(value || 0).toFixed(2);
}

function getCartTotal() {
  return cartItems.reduce(function (sum, item) {
    return sum + Number(item.price || 0) * Number(item.quantity || 1);
  }, 0);
}

function loadCartItems() {
  const checkoutSummary = JSON.parse(localStorage.getItem('techconnectCheckoutSummary')) || {};
  const savedItems = checkoutSummary.items || JSON.parse(localStorage.getItem('techconnectCart')) || [];

  cartItems = savedItems.map(function (item) {
    return {
      productId: item.productId || 'N/A',
      name: item.name || item.description || 'Unnamed Product',
      quantity: Number(item.quantity) || 1,
      price: Number(item.price || 0).toFixed(2)
    };
  });
}

function autofillBillingDetails() {
  $.getJSON(billingDetailsSeedEndpoint)
    .done(function (billingDetails) {
      const savedBilling = Array.isArray(billingDetails) ? billingDetails[0] : billingDetails;

      if (!savedBilling) {
        return;
      }

      const address = savedBilling.address || {};
      const paymentMethod = savedBilling.paymentMethod || {};

      $('#fullName').val(savedBilling.fullName || '');
      $('#address').val(address.street || '');
      $('#city').val(address.city || '');
      $('#state').val(address.state || '');
      $('#zipCode').val(address.zipCode || '');
      $('#cardNumber').val(paymentMethod.testCardNumber || paymentMethod.cardNumber || '');
      $('#expirationDate').val(paymentMethod.expirationDate || '');
      $('#securityCode').val(paymentMethod.securityCode || '');

      $('.form-control').each(function () {
        if ($(this).val().trim() !== '') {
          $(this).addClass('input-success');
        }
      });

      renderBillingPreview();
      setApiStatus('Billing details auto-filled from data/billing-details.json.', 'text-success');
    })
    .fail(function () {
      setApiStatus('Could not auto-fill billing details from data/billing-details.json.', 'text-danger');
    });
}

function buildBillingDocument() {
  return {
    billingId: 'BILL-' + Date.now(),
    fullName: $('#fullName').val().trim(),
    address: $('#address').val().trim(),
    city: $('#city').val().trim(),
    state: $('#state').val().trim().toUpperCase(),
    zipCode: $('#zipCode').val().trim(),
    cardNumber: $('#cardNumber').val().replace(/\D/g, ''),
    expirationDate: $('#expirationDate').val(),
    securityCode: $('#securityCode').val().replace(/\D/g, ''),
    orderSummary: cartItems,
    totalAmount: Number(getCartTotal().toFixed(2)),
    shippingDetails: $('#shippingDetails').val()
  };
}

function buildSafeBillingPreview() {
  const document = buildBillingDocument();
  const cardNumber = document.cardNumber;

  return {
    ...document,
    cardNumber: cardNumber ? '**** **** **** ' + cardNumber.slice(-4) : '',
    securityCode: document.securityCode ? '***' : ''
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

function validateBillingForm() {
  const billing = buildBillingDocument();
  let valid = true;

  valid = showError('fullName', 'fullNameErr', billing.fullName === '') && valid;
  valid = showError('address', 'addressErr', billing.address === '') && valid;
  valid = showError('cardNumber', 'cardNumberErr', billing.cardNumber.length < 12 || billing.cardNumber.length > 19) && valid;
  valid = showError('expirationDate', 'expirationDateErr', billing.expirationDate === '') && valid;
  valid = showError('securityCode', 'securityCodeErr', billing.securityCode.length < 3 || billing.securityCode.length > 4) && valid;

  return valid;
}

function renderOrderSummary() {
  if (cartItems.length === 0) {
    $('#orderSummaryTable').html('<tr><td colspan="4" class="text-center text-muted py-4">No cart items found.</td></tr>');
  } else {
    const rows = cartItems.map(function (item) {
      const subtotal = Number(item.price) * item.quantity;

      return `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${money(item.price)}</td>
          <td>${money(subtotal)}</td>
        </tr>
      `;
    }).join('');

    $('#orderSummaryTable').html(rows);
  }

  $('#orderTotal').text(money(getCartTotal()));
}

function renderBillingPreview() {
  $('#billingJsonPreview').text(JSON.stringify(buildSafeBillingPreview(), null, 2));
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

function submitBilling(event) {
  event.preventDefault();
  renderBillingPreview();

  if (!validateBillingForm()) {
    setApiStatus('Please fix the form errors before submitting.', 'text-danger');
    return;
  }

  setApiStatus('Sending billing JSON to the Node REST API...', 'text-muted');

  $.ajax({
    url: billingEndpoint,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(buildBillingDocument()),
    success: function (response) {
      setApiStatus(response.message || 'Billing details submitted successfully.', 'text-success');
      showToast();
    },
    error: function () {
      setApiStatus('Billing details could not be sent to the Node REST API.', 'text-danger');
    }
  });
}

function resetBillingForm() {
  $('#billingForm')[0].reset();
  $('.error-msg').removeClass('show');
  $('.form-control, .form-select').removeClass('input-error input-success');
  setApiStatus('No API request sent yet.', 'text-muted');
  renderBillingPreview();
}

$(document).ready(function () {
  loadCartItems();
  renderOrderSummary();
  renderBillingPreview();
  autofillBillingDetails();

  $('#billingForm').on('submit', submitBilling);
  $('#clearBilling').on('click', resetBillingForm);
  $('#billingForm input, #billingForm select').on('input change', renderBillingPreview);
});

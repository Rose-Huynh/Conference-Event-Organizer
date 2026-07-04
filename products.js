let products = JSON.parse(localStorage.getItem('techconnectProducts')) || [];

function saveSessions() {
  localStorage.setItem('techconnectProducts', JSON.stringify(products, null, 2));
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
  const productId = $('#productId').val().trim();
  const productTitle = $('#productTitle').val().trim();
  const productCategory = $('#productCategory').val();
  const productUnit = $('#sessionUnit').val();
  const productPrice = $('#sessionPrice').val().trim();

  let valid = true;

  valid = showError('productId', 'productIdErr', productId === '') && valid;
  valid = showError('productTitle', 'productTitleErr', productTitle === '') && valid;
  valid = showError('productCategory', 'productCategoryErr', productCategory === '') && valid;
  valid = showError('productUnit', 'productUnitErr', productUnit === '') && valid;
  valid = showError(
    'sessionPrice',
    'sessionPriceErr',
    productPrice === '' || isNaN(productPrice) || Number(productPrice) < 0
  ) && valid;

  return valid;
}
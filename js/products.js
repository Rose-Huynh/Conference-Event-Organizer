const productsEndpoint = '/api/products';
let products = [];

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

function validateProductForm() {
  const productName = $('#productName').val().trim();
  const productDescription = $('#productDescription').val().trim();
  const productCategory = $('#productCategory').val();
  const productUnit = $('#productUnit').val();
  const productPrice = $('#productPrice').val().trim();

  let valid = true;

  valid = showError('productName', 'productNameErr', productName === '') && valid;
  valid = showError('productDescription', 'productDescriptionErr', productDescription === '') && valid;
  valid = showError('productCategory', 'productCategoryErr', productCategory === '') && valid;
  valid = showError('productUnit', 'productUnitErr', productUnit === '') && valid;
  valid = showError(
    'productPrice',
    'productPriceErr',
    productPrice === '' || isNaN(productPrice) || Number(productPrice) < 0
  ) && valid;

  return valid;
}

function generateProductId() {
  const maxIdNumber = products.reduce(function (max, product) {
    const idNumber = parseInt(String(product.productId).replace(/\D/g, ''), 10);

    if (isNaN(idNumber)) {
      return max;
    }

    return Math.max(max, idNumber);
  }, 109);

  return 'P' + String(maxIdNumber + 1).padStart(3, '0');
}

function submitProduct(event) {
  event.preventDefault();

  if (!validateProductForm()) return;

  const editIndex = parseInt($('#editIndex').val(), 10);

  const productEntry = {
    productId: editIndex >= 0 ? products[editIndex].productId : generateProductId(),
    name: $('#productName').val().trim(),
    description: $('#productDescription').val().trim(),
    category: $('#productCategory').val(),
    unitOfMeasure: $('#productUnit').val(),
    price: Number($('#productPrice').val()).toFixed(2),
    additionalInfo: $('#productInfo').val().trim() || 'N/A'
  };

  const requestMethod = editIndex >= 0 ? 'PUT' : 'POST';
  const requestUrl = editIndex >= 0
    ? productsEndpoint + '/' + encodeURIComponent(productEntry.productId)
    : productsEndpoint;

  $.ajax({
    url: requestUrl,
    method: requestMethod,
    contentType: 'application/json',
    data: JSON.stringify(productEntry),
    success: function () {
      initializeProductPage();
      resetForm();
      showToast();
    },
    error: function () {
      alert('Product could not be saved to the Node API.');
    }
  });
}

function renderProducts(data) {
  $('#countBadge').text(data.length + ' products');

  if (data.length === 0) {
    $('#productTable').html(`
      <tr>
        <td colspan="8" class="text-center text-muted py-4">No matching products found.</td>
      </tr>
    `);
    return;
  }

  const rows = data.map(function (product) {
    const originalIndex = products.findIndex(function (item) {
      return item.productId === product.productId;
    });

    return `
      <tr>
        <td><strong>${product.productId}</strong></td>
        <td>${product.name || product.description}</td>
        <td>${product.description}</td>
        <td><span class="badge-type">${product.category}</span></td>
        <td>${product.unitOfMeasure}</td>
        <td>$${product.price}</td>
        <td>${product.additionalInfo || 'N/A'}</td>
        <td>
          <button class="btn-edit me-1" type="button" data-index="${originalIndex}">Edit</button>
          <button class="btn-delete" type="button" data-index="${originalIndex}">Delete</button>
        </td>
      </tr>
    `;
  }).join('');

  $('#productTable').html(rows);
}

function renderJSON(data) {
  $('#jsonPreview').text(JSON.stringify(data, null, 2));
}

function searchProducts() {
  const searchTerm = $('#searchInput').val().toLowerCase();

  const filteredProducts = products.filter(function (product) {
    return (
      String(product.productId || '').toLowerCase().includes(searchTerm) ||
      String(product.name || '').toLowerCase().includes(searchTerm) ||
      String(product.description || '').toLowerCase().includes(searchTerm) ||
      String(product.category || '').toLowerCase().includes(searchTerm) ||
      String(product.unitOfMeasure || '').toLowerCase().includes(searchTerm) ||
      String(product.additionalInfo || '').toLowerCase().includes(searchTerm)
    );
  });

  renderProducts(filteredProducts);
  renderJSON(filteredProducts);
}

function editProduct(index) {
  const product = products[index];

  $('#productId').val(product.productId);
  $('#productName').val(product.name || product.description);
  $('#productDescription').val(product.description);
  $('#productCategory').val(product.category);
  $('#productUnit').val(product.unitOfMeasure);
  $('#productPrice').val(product.price);
  $('#productInfo').val(product.additionalInfo === 'N/A' ? '' : product.additionalInfo);

  $('#editIndex').val(index);
  $('#formTitle').text('Update Product');
  $('#saveProduct').text('Update Product');

  $('.error-msg').removeClass('show');
  $('.form-control, .form-select').removeClass('input-error').addClass('input-success');

  $('html, body').animate({ scrollTop: 0 }, 400);
}

function deleteProduct(index) {
  const product = products[index];

  if (confirm('Remove this product?')) {
    $.ajax({
      url: productsEndpoint + '/' + encodeURIComponent(product.productId),
      method: 'DELETE',
      success: function () {
        initializeProductPage();
      },
      error: function () {
        alert('Product could not be deleted from the Node API.');
      }
    });
  }
}

function resetForm() {
  $('#editIndex').val('-1');
  $('#productForm')[0].reset();

  $('#formTitle').text('Add Product');
  $('#saveProduct').text('Save Product');

  $('.error-msg').removeClass('show');
  $('.form-control, .form-select').removeClass('input-error input-success');
}

function showToast() {
  $('#successToast').fadeIn(200);

  setTimeout(function () {
    $('#successToast').fadeOut(200);
  }, 2500);
}

function initializeProductPage() {
  $.getJSON(productsEndpoint)
    .done(function (data) {
      products = data;
      renderProducts(products);
      renderJSON(products);
    })
    .fail(function () {
      renderProducts(products);
      renderJSON(products);
      alert('Could not load products from the Node API.');
    });
}

$(document).ready(function () {
  initializeProductPage();

  $('#productForm').on('submit', submitProduct);

  $('#clearProduct').on('click', function () {
    resetForm();
  });

  $('#searchInput').on('keyup', function () {
    searchProducts();
  });

  $('#productTable').on('click', '.btn-edit', function () {
    const index = parseInt($(this).data('index'), 10);
    editProduct(index);
  });

  $('#productTable').on('click', '.btn-delete', function () {
    const index = parseInt($(this).data('index'), 10);
    deleteProduct(index);
  });
});
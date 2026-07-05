let products = JSON.parse(localStorage.getItem('techconnectProducts')) || [];

function saveProduct() {
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

function validateProductForm() {
  const productId = $('#productId').val().trim();
  const productTitle = $('#productTitle').val().trim();
  const productCategory = $('#productCategory').val();
  const productUnit = $('#productUnit').val();
  const productPrice = $('#productPrice').val().trim();

  let valid = true;

  valid = showError('productId', 'productIdErr', productId === '') && valid;
  valid = showError('productTitle', 'productTitleErr', productTitle === '') && valid;
  valid = showError('productCategory', 'productCategoryErr', productCategory === '') && valid;
  valid = showError('productUnit', 'productUnitErr', productUnit === '') && valid;
  valid = showError(
    'productPrice',
    'productPriceErr',
    productPrice === '' || isNaN(productPrice) || Number(productPrice) < 0
  ) && valid;

  return valid;
}

function submitProduct(event) {
  event.preventDefault();

  if (!validateProductForm()) return;

  const editIndex = parseInt($('#editIndex').val(), 10);

  const productEntry = {
    productId: $('#productId').val().trim(),
    description: $('#productTitle').val().trim(),
    category: $('#productCategory').val(),
    unitOfMeasure: $('#productUnit').val(),
    price: Number($('#productPrice').val()).toFixed(2),
    additionalInfo: $('#productInfo').val().trim() || 'N/A'
  };

  if (editIndex >= 0) {
    products[editIndex] = productEntry;
  } else {
    products.push(productEntry);
  }

  saveProduct();
  renderProduct(products);
  renderJSON(products);
  resetForm();
  showToast();
}

function renderProducts(data) {
  $('#countBadge').text(data.length + ' products');

  if (data.length === 0) {
    $('#productTable').html(`
      <tr>
        <td colspan="7" class="text-center text-muted py-4">No matching products found.</td>
      </tr>
    `);
    return;
  }

  const rows = data.map((products) => {
    const originalIndex = products.findIndex(item => item.productId === products.productId);

    return `
      <tr>
        <td><strong>${products.productId}</strong></td>
        <td>${products.description}</td>
        <td><span class="badge-type">${products.category}</span></td>
        <td>${products.unitOfMeasure}</td>
        <td>$${products.price}</td>
        <td>${products.additionalInfo}</td>
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

  const filteredProducts = products.filter(products => {
    return (
      products.productId.toLowerCase().includes(searchTerm) ||
      products.description.toLowerCase().includes(searchTerm) ||
      products.category.toLowerCase().includes(searchTerm) ||
      products.unitOfMeasure.toLowerCase().includes(searchTerm) ||
      products.additionalInfo.toLowerCase().includes(searchTerm)
    );
  });

  renderProducts(filteredProducts);
  renderJSON(filteredProducts);
}

function editProducts(index) {
  const products = products[index];

  $('#productsId').val(products.productId);
  $('#productsTitle').val(products.description);
  $('#productsCategory').val(products.category);
  $('#productsUnit').val(products.unitOfMeasure);
  $('#productsPrice').val(products.price);
  $('#productsInfo').val(products.additionalInfo === 'N/A' ? '' : products.additionalInfo);

  $('#editIndex').val(index);
  $('#formTitle').text('Update Product');
  $('#saveProduct').text('Update Product');

  $('.error-msg').removeClass('show');
  $('.form-control, .form-select').removeClass('input-error').addClass('input-success');

  $('html, body').animate({ scrollTop: 0 }, 400);
}

function deleteProduct(index) {
  if (confirm('Remove this product?')) {
    products.splice(index, 1);
    saveProduct();
    renderProducts(products);
    renderJSON(products);
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

  setTimeout(() => {
    $('#successToast').fadeOut(200);
  }, 2500);
}

$(document).ready(function () {
  renderProducts(products);
  renderJSON(products);

  $('#productForm').on('submit', submitProduct);

  $('#clearProduct').on('click', function () {
    resetForm();
  });

  $('#searchInput').on('keyup', function () {
    searchProducts();
  });

  $('#productTable').on('click', '.btn-edit', function () {
    const index = parseInt($(this).data('index'), 10);
    editProducts(index);
  });

  $('#productTable').on('click', '.btn-delete', function () {
    const index = parseInt($(this).data('index'), 10);
    deleteProduct(index);
  });
});
const productsEndpoint = '/api/products';
const cartEndpoint = '/api/cart';

let products = [];
let cartItems = [];

function normalizeProductId(productId) {
  return String(productId || '').trim().toUpperCase().replace(/^EVT/, 'P');
}

function normalizeProduct(product) {
  return {
    productId: normalizeProductId(product.productId),
    name: product.name || product.description || 'Unnamed Product',
    description: product.description || 'N/A',
    category: product.category || 'N/A',
    unitOfMeasure: product.unitOfMeasure || 'N/A',
    price: Number(product.price || 0).toFixed(2),
    additionalInfo: product.additionalInfo || 'N/A'
  };
}

function loadCartItems() {
  const savedCartItems = JSON.parse(localStorage.getItem('techconnectCart')) || [];

  return savedCartItems.map(function (item) {
    return {
      productId: normalizeProductId(item.productId),
      name: item.name || item.description || 'Unnamed Product',
      description: item.description || 'N/A',
      category: item.category || 'N/A',
      unitOfMeasure: item.unitOfMeasure || 'N/A',
      price: Number(item.price || 0).toFixed(2),
      additionalInfo: item.additionalInfo || 'N/A',
      quantity: Number(item.quantity) || 1
    };
  });
}

function saveCart() {
  localStorage.setItem('techconnectCart', JSON.stringify(cartItems, null, 2));
}

function money(value) {
  return '$' + Number(value).toFixed(2);
}

function getCartTotal() {
  return cartItems.reduce(function (sum, item) {
    return sum + Number(item.price) * item.quantity;
  }, 0);
}

function buildCartPayload() {
  return {
    cartId: 'TC-CART-' + Date.now(),
    event: 'TechConnect 2026',
    items: cartItems,
    total: Number(getCartTotal().toFixed(2))
  };
}

function showToast(message) {
  $('#cartToast').text(message).fadeIn(200);

  setTimeout(function () {
    $('#cartToast').fadeOut(200);
  }, 2200);
}

function renderProducts(productList) {
  $('#productCount').text(productList.length + ' products');

  if (productList.length === 0) {
    $('#productResults').html('<tr><td colspan="6" class="text-center text-muted py-4">No products found.</td></tr>');
    return;
  }

  const rows = productList.map(function (product) {
    return `
      <tr>
        <td>${product.name}</td>
        <td>${product.description}</td>
        <td><span class="badge-type">${product.category}</span></td>
        <td>${product.unitOfMeasure}</td>
        <td>${money(product.price)}</td>
        <td class="text-end">
          <button class="btn-edit add-to-cart" type="button" data-id="${product.productId}">Add</button>
        </td>
      </tr>
    `;
  }).join('');

  $('#productResults').html(rows);
}

function renderCartJSON() {
  $('#cartJsonPreview').text(JSON.stringify(buildCartPayload(), null, 2));
}

function renderCart() {
  if (cartItems.length === 0) {
    $('#cartTable').html('<tr><td colspan="5" class="text-center text-muted py-4">Your cart is empty.</td></tr>');
  } else {
    const rows = cartItems.map(function (item) {
      const subtotal = Number(item.price) * item.quantity;

      return `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${money(item.price)}</td>
          <td>${money(subtotal)}</td>
          <td class="text-end">
            <button class="btn-delete remove-from-cart" type="button" data-id="${item.productId}">Remove</button>
          </td>
        </tr>
      `;
    }).join('');

    $('#cartTable').html(rows);
  }

  $('#cartTotal').text(money(getCartTotal()));
  renderCartJSON();
}

function searchProducts() {
  const searchTerm = $('#productSearch').val().toLowerCase();

  const results = products.filter(function (product) {
    return (
      String(product.productId || '').toLowerCase().includes(searchTerm) ||
      String(product.name || '').toLowerCase().includes(searchTerm) ||
      String(product.description || '').toLowerCase().includes(searchTerm) ||
      String(product.category || '').toLowerCase().includes(searchTerm) ||
      String(product.unitOfMeasure || '').toLowerCase().includes(searchTerm) ||
      String(product.additionalInfo || '').toLowerCase().includes(searchTerm)
    );
  });

  renderProducts(results);
}

function clearCheckoutMessages() {
  $('#checkoutMessage').removeClass('text-success text-danger').text('');
  $('#ajaxStatus').removeClass('text-success text-danger').text('');
}

function addToCart(productId) {
  const product = products.find(function (item) {
    return item.productId === productId;
  });

  const existingItem = cartItems.find(function (item) {
    return item.productId === productId;
  });

  if (existingItem) {
    existingItem.quantity += 1;
  } else if (product) {
    cartItems.push({
      productId: product.productId,
      name: product.name,
      description: product.description,
      category: product.category,
      unitOfMeasure: product.unitOfMeasure,
      price: product.price,
      additionalInfo: product.additionalInfo,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  clearCheckoutMessages();
  showToast('Product added to cart.');
}

function removeFromCart(productId) {
  cartItems = cartItems.filter(function (item) {
    return item.productId !== productId;
  });

  saveCart();
  renderCart();
  clearCheckoutMessages();
  showToast('Product removed from cart.');
}

function checkoutCart() {
  clearCheckoutMessages();

  if (cartItems.length === 0) {
    $('#checkoutMessage')
      .addClass('text-danger')
      .text('Cart must contain at least one item before checkout.');
    return;
  }

  const cartPayload = buildCartPayload();

  $('#checkoutMessage')
    .addClass('text-success')
    .text('Cart is ready for checkout.');

  $.ajax({
    url: cartEndpoint,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(cartPayload),
    success: function (response) {
      $('#ajaxStatus')
        .addClass('text-success')
        .text(response.message || 'Cart data sent successfully to the Node REST API.');
    },
    error: function () {
      $('#ajaxStatus')
        .addClass('text-danger')
        .text('Cart data could not be sent to the Node REST API.');
    }
  });
}

function loadProductsFromApi() {
  $.getJSON(productsEndpoint)
    .done(function (data) {
      products = data.map(normalizeProduct);
      renderProducts(products);
    })
    .fail(function () {
      products = [];
      renderProducts(products);

      $('#ajaxStatus')
        .addClass('text-danger')
        .text('Could not load products from the Node API.');
    });
}

function initializeCartPage() {
  cartItems = loadCartItems();
  saveCart();

  loadProductsFromApi();
  renderCart();

  $('#productSearch').on('keyup', searchProducts);

  $('#productResults').on('click', '.add-to-cart', function () {
    addToCart($(this).data('id'));
  });

  $('#cartTable').on('click', '.remove-from-cart', function () {
    removeFromCart($(this).data('id'));
  });

  $('#checkoutButton').on('click', checkoutCart);
}

$(document).ready(function () {
  initializeCartPage();
});
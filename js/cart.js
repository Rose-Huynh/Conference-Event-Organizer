let productCatalog = [];
let products = [];
let cartItems = [];

function normalizeProductId(productId) {
  return productId.trim().toUpperCase().replace(/^EVT/, 'P');
}

function normalizeProduct(product) {
  return {
    productId: normalizeProductId(product.productId),
    name: product.name || product.description,
    description: product.description || 'N/A',
    category: product.category,
    unitOfMeasure: product.unitOfMeasure,
    price: Number(product.price).toFixed(2),
    additionalInfo: product.additionalInfo || 'N/A'
  };
}

function loadCartItems() {
  const savedCartItems = JSON.parse(localStorage.getItem('techconnectCart')) || [];

  return savedCartItems.map(function (item) {
    return {
      productId: normalizeProductId(item.productId),
      name: item.name || item.description,
      description: item.description || 'N/A',
      category: item.category,
      unitOfMeasure: item.unitOfMeasure,
      price: Number(item.price).toFixed(2),
      additionalInfo: item.additionalInfo || 'N/A',
      quantity: Number(item.quantity) || 1
    };
  });
}

function loadAllProducts() {
  const savedProducts = JSON.parse(localStorage.getItem('techconnectProducts')) || [];
  const productMap = {};

  productCatalog.forEach(function (product) {
    const normalizedProduct = normalizeProduct(product);
    productMap[normalizedProduct.productId] = normalizedProduct;
  });

  savedProducts.forEach(function (product) {
    const normalizedProduct = normalizeProduct(product);
    productMap[normalizedProduct.productId] = normalizedProduct;
  });

  return Object.values(productMap);
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
    cartId: 'TC-CART-001',
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
  products = loadAllProducts();
  const searchTerm = $('#productSearch').val().toLowerCase();

  const results = products.filter(function (product) {
    return (
      product.productId.toLowerCase().includes(searchTerm) ||
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm) ||
      product.unitOfMeasure.toLowerCase().includes(searchTerm) ||
      product.additionalInfo.toLowerCase().includes(searchTerm)
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
    url: '/api/cart',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(cartPayload),
    success: function () {
      $('#ajaxStatus')
        .addClass('text-success')
        .text('Cart data sent successfully to the REST API.');
    },
    error: function () {
      $('#ajaxStatus')
        .addClass('text-danger')
        .text('Future REST API is not available yet, but the AJAX request and JSON payload are ready.');
    }
  });
}

function initializeCartPage() {
  products = loadAllProducts();
  cartItems = loadCartItems();
  saveCart();
  renderProducts(products);
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
  $.getJSON('../data/products.json')
    .done(function (data) {
      productCatalog = data;
      initializeCartPage();
    })
    .fail(function () {
      console.warn('Could not load data/products.json. Start the site with a local server and try again.');
      initializeCartPage();
    });
});

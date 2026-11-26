/* Worksheet Hub (TEST site) - shared behaviour.
   Everything here is a teaching sandbox: no real data is stored or sent.
   The site "reports" what happened by pushing objects into the dataLayer (Stage 8). */
(function () {
  'use strict';

  /* ---------- Settings you can change while learning ---------- */
  var CFG = {
    currency: 'PKR',
    pushDataLayer: true,   // false = the site pushes NOTHING (use it to start with click-based tracking only)
    guardPurchase: true    // true = push 'purchase' once per order; false = push on every reload (to SEE duplicates)
  };

  /* ---------- The product catalogue (all fake) ---------- */
  var CATALOG = {
    sku_math5:    { item_id: 'sku_math5',    item_name: 'TEST Maths Grade 5 Workbook',   price: 1500, item_category: 'maths',   stock: 10 },
    sku_science5: { item_id: 'sku_science5', item_name: 'TEST Science Grade 5 Workbook', price: 600,  item_category: 'science', stock: 10 },
    sku_english5: { item_id: 'sku_english5', item_name: 'TEST English Grade 5 Workbook', price: 800,  item_category: 'english', stock: 0 }
  };

  /* ---------- Helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function fmt(n) { return Number(n).toLocaleString('en-US'); }
  function setMsg(el, text, ok) {
    if (!el) { return; }
    el.textContent = text;
    el.className = ok ? 'ok' : 'err';
  }

  // Always use push (never reassign dataLayer).
  function dl(obj) {
    if (!CFG.pushDataLayer) { return; }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(obj);
  }
  // E-commerce rule: clear the old ecommerce object first, then push the event.
  function ecom(eventName, ecommerce) {
    dl({ ecommerce: null });
    dl({ event: eventName, ecommerce: ecommerce });
  }

  function getCart() {
    try { return JSON.parse(localStorage.getItem('wh_cart') || '[]'); } catch (e) { return []; }
  }
  function saveCart(cart) {
    try { localStorage.setItem('wh_cart', JSON.stringify(cart)); } catch (e) { /* storage blocked: ignore */ }
  }
  function toItems(cart) {
    return cart.map(function (line) {
      var p = CATALOG[line.item_id];
      return { item_id: p.item_id, item_name: p.item_name, price: p.price, quantity: line.quantity, item_category: p.item_category };
    });
  }
  // value = sum of price x quantity, WITHOUT shipping or tax (the agreed rule for this shop)
  function subtotal(cart) {
    return cart.reduce(function (sum, line) { return sum + CATALOG[line.item_id].price * line.quantity; }, 0);
  }
  function updateCartCount() {
    var count = getCart().reduce(function (n, l) { return n + l.quantity; }, 0);
    var els = document.querySelectorAll('.cart-count');
    for (var i = 0; i < els.length; i++) { els[i].textContent = count; }
  }

  /* ---------- Newsletter (footer of every page) ---------- */
  function initNewsletter() {
    var form = $('newsletter-form');
    if (!form) { return; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('newsletter-email').value.trim();
      var msg = $('newsletter-msg');
      var valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
      if (!valid) { setMsg(msg, 'Please enter a valid email address.', false); return; }
      setMsg(msg, 'Thanks, subscribed!', true);               // success signal on the page
      dl({ event: 'sign_up', method: 'email' });               // the site reports success (the email itself is NEVER pushed)
      $('newsletter-email').value = '';
    });
  }

  /* ---------- Page: shop (category list) ---------- */
  function pageShop() {
    var items = Object.keys(CATALOG).map(function (k, i) {
      var p = CATALOG[k];
      return { item_id: p.item_id, item_name: p.item_name, price: p.price, item_category: p.item_category, index: i + 1, item_list_name: 'All worksheets' };
    });
    ecom('view_item_list', { item_list_name: 'All worksheets', items: items });
  }

  /* ---------- Page: product ---------- */
  function pageProduct() {
    var btn = $('add-to-cart');
    if (!btn) { return; }
    var sku = btn.getAttribute('data-sku');
    var p = CATALOG[sku];
    if (!p) { return; }
    var item = { item_id: p.item_id, item_name: p.item_name, price: p.price, quantity: 1, item_category: p.item_category };

    ecom('view_item', { currency: CFG.currency, value: p.price, items: [item] });

    btn.addEventListener('click', function () {
      var msg = $('cart-msg');
      if (p.stock <= 0) {                                      // negative test: a failed add must NOT push add_to_cart
        setMsg(msg, 'Sorry, this item is out of stock.', false);
        return;
      }
      var cart = getCart();
      var found = false;
      for (var i = 0; i < cart.length; i++) {
        if (cart[i].item_id === sku) { cart[i].quantity += 1; found = true; }
      }
      if (!found) { cart.push({ item_id: sku, quantity: 1 }); }
      saveCart(cart);
      updateCartCount();
      setMsg(msg, 'Added to cart.', true);                     // success signal on the page
      ecom('add_to_cart', { currency: CFG.currency, value: p.price, items: [item] });
    });
  }

  /* ---------- Page: cart ---------- */
  function pageCart() {
    var cart = getCart();
    var table = $('cart-table'), empty = $('cart-empty'), body = $('cart-body');
    if (!cart.length) { empty.hidden = false; table.hidden = true; $('checkout-link').hidden = true; return; }
    empty.hidden = true; table.hidden = false; $('checkout-link').hidden = false;
    body.innerHTML = '';
    cart.forEach(function (line) {
      var p = CATALOG[line.item_id];
      var tr = document.createElement('tr');
      tr.innerHTML = '<td></td><td>Rs ' + fmt(p.price) + '</td><td>' + line.quantity + '</td><td>Rs ' + fmt(p.price * line.quantity) +
        '</td><td><button class="btn remove-btn" data-sku="' + line.item_id + '">Remove</button></td>';
      tr.firstChild.textContent = p.item_name;
      body.appendChild(tr);
    });
    $('cart-subtotal').textContent = 'Rs ' + fmt(subtotal(cart));
    ecom('view_cart', { currency: CFG.currency, value: subtotal(cart), items: toItems(cart) });

    body.addEventListener('click', function (e) {
      var t = e.target;
      if (!t.classList || !t.classList.contains('remove-btn')) { return; }
      var sku = t.getAttribute('data-sku');
      var current = getCart();
      var removed = current.filter(function (l) { return l.item_id === sku; });
      var left = current.filter(function (l) { return l.item_id !== sku; });
      saveCart(left);
      updateCartCount();
      if (removed.length) {
        var p = CATALOG[sku];
        ecom('remove_from_cart', { currency: CFG.currency, value: p.price * removed[0].quantity, items: toItems(removed) });
      }
      pageCart();
    });
  }

  /* ---------- Page: checkout ---------- */
  function nextOrderId() {
    var n;
    try { n = parseInt(localStorage.getItem('wh_order_seq') || '0', 10) + 1; localStorage.setItem('wh_order_seq', String(n)); }
    catch (e) { n = Date.now() % 100000; }
    return 'TEST-' + String(n).padStart(3, '0');
  }
  function pageCheckout() {
    var cart = getCart();
    var form = $('checkout-form'), empty = $('checkout-empty');
    if (!cart.length) { empty.hidden = false; form.hidden = true; return; }
    empty.hidden = true; form.hidden = false;
    $('co-total').textContent = fmt(subtotal(cart));
    var base = function () { return { currency: CFG.currency, value: subtotal(cart), items: toItems(cart) }; };

    ecom('begin_checkout', base());

    $('co-shipping').addEventListener('change', function () {
      if (!this.value) { return; }
      var d = base(); d.shipping_tier = this.value;
      ecom('add_shipping_info', d);
    });
    var radios = document.getElementsByName('payment');
    for (var i = 0; i < radios.length; i++) {
      radios[i].addEventListener('change', function () {
        var d = base(); d.payment_type = this.value;
        ecom('add_payment_info', d);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('checkout-msg');
      var name = $('co-name').value.trim(), addr = $('co-address').value.trim(), ship = $('co-shipping').value;
      var pay = '';
      for (var j = 0; j < radios.length; j++) { if (radios[j].checked) { pay = radios[j].value; } }
      if (!name || !addr || !ship || !pay) {                    // negative test: an incomplete order creates NO purchase
        setMsg(msg, 'Please complete every field and choose a payment method.', false);
        return;
      }
      // Personal details are never stored or pushed. Only the order summary is kept.
      var order = { id: nextOrderId(), items: toItems(cart), value: subtotal(cart), payment_type: pay, shipping_tier: ship };
      try { localStorage.setItem('wh_last_order', JSON.stringify(order)); } catch (err) { /* ignore */ }
      saveCart([]);
      window.location.href = 'thank-you.html';
    });
  }

  /* ---------- Page: thank-you (order confirmation) ---------- */
  function alreadySent(id) { try { return !!localStorage.getItem('purchase_sent_' + id); } catch (e) { return false; } }
  function markSent(id) { try { localStorage.setItem('purchase_sent_' + id, '1'); } catch (e) { /* ignore */ } }
  function pageThankYou() {
    var order = null;
    try { order = JSON.parse(localStorage.getItem('wh_last_order') || 'null'); } catch (e) { order = null; }
    if (!order) { $('no-order').hidden = false; return; }
    $('order-box').hidden = false;
    $('order-id').textContent = order.id;
    $('order-value').textContent = fmt(order.value);
    var list = $('order-items');
    order.items.forEach(function (it) {
      var li = document.createElement('li');
      li.textContent = it.item_name + ' x ' + it.quantity + ' (Rs ' + fmt(it.price) + ' each)';
      list.appendChild(li);
    });
    if (!CFG.guardPurchase || !alreadySent(order.id)) {         // push once per order
      ecom('purchase', { transaction_id: order.id, currency: CFG.currency, value: order.value, items: order.items });
      markSent(order.id);
    }
  }

  /* ---------- Page: contact ---------- */
  function pageContact() {
    var form = $('enquiry-form');
    if (!form) { return; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('enquiry-msg');
      var name = $('enq-name').value.trim(), text = $('enq-message').value.trim();
      if (!name || !text) { setMsg(msg, 'Please fill in your name and message.', false); return; }
      setMsg(msg, 'Thank you, we received your enquiry.', true);
      dl({ event: 'generate_lead', form_name: 'enquiry' });     // no personal data in the push
      form.reset();
    });
  }

  /* ---------- Start ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    updateCartCount();
    initNewsletter();
    var page = document.body.getAttribute('data-page');
    if (page === 'shop') { pageShop(); }
    else if (page === 'product') { pageProduct(); }
    else if (page === 'cart') { pageCart(); }
    else if (page === 'checkout') { pageCheckout(); }
    else if (page === 'thankyou') { pageThankYou(); }
    else if (page === 'contact') { pageContact(); }
  });
})();

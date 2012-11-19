(function() {
  /* initialize with a background color and an Imgur key */
  var lc = $('.literally').literallycanvas({
    backgroundColor: 'whiteSmoke',
    imgurKey: '9600756ae5f127ca192d991140ee28c4'
  });

  el = $('.share-to-imgur').get(0);
  $el = $(el);
  $button = $el.find('button');
  $urlEl = $el.find('.imgur-url');
  $button.click(function(e) {
    $urlEl.html('Uploading...');
    $button.attr('disabled', 'disabled');
    lc.uploadCanvasToImgur().done(function(url) {
      $el.find('.imgur-url').html($('<a href="' + url + '">' + url + '</a>'));
    }).fail(function(msg) {
      $urlEl.html(_.escape(msg));
    }).always(function() {
      $button.removeAttr('disabled');
    });
  });

  $('.get-image').click(function(e) {
    window.open($('.literally').canvasImageURL());
  });

  // courtesy of jQuery UI
  $('.literally').resizable();
}).call(this);

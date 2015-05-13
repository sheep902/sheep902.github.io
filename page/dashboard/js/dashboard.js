$(function(){
    var $body = $('body');
    var $header = $('#header');
    var $wrap = $('#wrap');
    var $menus = $('.menus');
    var height = $body.height();
 //   $menus.height( height - $header.height() );
 //   $wrap.height( height - $header.height() );
    $header.on('click',function(){
        $body.toggleClass('push');
    })
})
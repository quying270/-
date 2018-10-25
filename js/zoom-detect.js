/**
 * �����ҳ �Ŵ���� С�ļ��
 */
var WebpageZoomDetect = (function(){

    "use strict";

    /**
     * ���ż�⣬��ȡ�Ŵ����
     * @type {*}
     */
    var ZoomDetect = (function(){
        /**
         * �Ƿ�֧�ֵ�ǰ����������ż��
         * @type {Boolean}
         * @private
         */
        var _isSupport = true;

        /**
         * IE8+ �¼��ҳ�����ű���
         * @return {Number}
         */
        var ie8plus = function(){
            return Math.round((screen.deviceXDPI / screen.logicalXDPI) * 100) / 100;
        };

        /**
         * IE10+ �¼��ҳ�����ű���
         * @return {Number}
         */
        var ie10plus = function () {
            return Math.round((document.documentElement.offsetHeight / window.innerHeight) * 100) / 100;
        };

        /**
         * ��׼����� �¼��ҳ�����ű���
         * @return {Number}
         */
        var standard = function () {
            var zoom = window.top.outerWidth / window.top.innerWidth;
            return Math.round(zoom * 100) / 100;
        };

        /**
         * ͨ��css�����ʾ����
         * @param ratio
         * @return {Boolean}
         */
        var wzdMatchMedia = function(ratio){
            var cssRule = [
                '.-wzd-zoomdetect {',
                    'text-decoration: none',
                '}',
                '@media only screen and (-o-min-device-pixel-ratio: ',ratio,'/1),',
                    'only screen and (min--moz-device-pixel-ratio: ',ratio,'), ',
                    'only screen and (-webkit-min-device-pixel-ratio: ',ratio,'), ',
                    'only screen and (min-resolution: 240dpi), ',
                    'only screen and (min-resolution: 2dppx) {',
                        '.-wzd-zoomdetect {',
                            'text-decoration: underline',
                        '}',
                '}'
            ].join('');

            var style, div, match = false;
            try{
                div = $('<div>a</div>').hide().addClass('-wzd-zoomdetect').appendTo('body');
                style = $('<style type="text/css">' + cssRule + '</style>');
                style.insertBefore(div);
                match = div.css('text-decoration') == 'underline';
                div.remove();
                style.remove();
            }catch(err){
            }

            return match;
        };

        /**
         * ��Firefox�У�ͨ�����ֲ��ҷ����ȶ����ű���
         * @return {Number}
         */
        var firefox = function(){
            // ����
            var epsilon = 0.01;
            var binarySearch = function(minRatio,maxRatio,repeatTime){
                var midRatio = (minRatio + maxRatio) / 2;
                if (repeatTime <= 0 || maxRatio - minRatio < epsilon) {
                    return midRatio;
                }
                if (wzdMatchMedia(midRatio)) {
                    return binarySearch(midRatio, maxRatio, repeatTime - 1);
                } else {
                    return binarySearch(minRatio, midRatio, repeatTime - 1);
                }
            };
            return binarySearch(0,5,10);
        };

        /**
         * ��������������ÿ�ζ����
         * @type {Object}
         * @private
         */
        var _retinaInfo = {
            detected : false,
            retina : false
        };

        /**
         * �жϵ�ǰ��Ļ�Ƿ�ΪRetina��
         */
        var isRetina = function(){
            if(_retinaInfo.detected) {
                return _retinaInfo.retina;
            }

            _retinaInfo = {
                detected: true,
                retina : wzdMatchMedia(2)
            };

            return _retinaInfo.retina;
        };

        /**
         * ִ�м�⣬��ȡ���ű���
         * @private
         */
        var detect = function () {
            var ratio = 1;
            var ua = navigator.userAgent.toLowerCase();

            // IE8+
            if (!isNaN(screen.logicalXDPI) && !isNaN(screen.systemXDPI)) {
                ratio = ie8plus();
            }
            // IE10+ / Touch
            else if (window.navigator.msMaxTouchPoints) {
                ratio = ie10plus();
            }
            // WebKit ���� Opera
            else if (/webkit/i.test(ua) || /opera/i.test(ua)) {
                ratio = standard();
            }
            // Firefox��������
            else if (/firefox/i.test(ua)) {
                if(isRetina()) {
                    ratio = 1;
                    // ��֧�ֵ�ǰRetina��Ļ�µ�FF
                    _isSupport = false;
                }else{
                    ratio = firefox();
                }
            }
            // �������
            else if(parseInt(window.top.outerWidth,10)) {
                ratio = standard();
            }else{
                // ��֧�ֵ�ǰ���������ҳ���ż��
                _isSupport = false;
            }

            return ratio;
        };

        /**
         * �ж�����Ƿ�֧�ֵ�ǰ���������ҳ���ż��
         * @return {Boolean}
         */
        var support = function(){
            detect();
            return _isSupport;
        };

        return {
            support : support,
            detect : detect
        };
    })();

    /**
     * cookie�����ļ���
     * @type {Object}
     */
    var CookieHandler = {
        // ��ȡcookie
        get : function(key) {
            var reg = new RegExp("(^| )" + key + "=([^;\/]*)([^;\x24]*)(;|\x24)");
            var result = reg.exec(document.cookie);

            return result ? (result[2] || null) : null;
        },

        // ����cookie
        set : function(config) {
            // ����cookie����ʱ�䣺����
            var expires = new Date();
            expires.setTime(expires.getTime() + 86400000*183);

            document.cookie = config.key + "=" + config.value
                + (config.path ? "; path=" + (config.path == './' ? '' : config.path) : "/")
                + ( expires ? "; expires=" + expires.toGMTString() : "")
                + (config.domain ? "; domain=" + config.domain : "")
                + (config.secure ? "; secure" : '');
        }
    };

    var _intervalId;
    var _running = false;

    /**
     * ���һ��
     * @private
     */
    var _detect = function(){
        var _html = [
            '<div class="mod-zoomdetect">',
                '<a href="#" class="wzd-btnclose" title="�ر�">�ر�</a>',
                '<div>',
                    '<span class="wzd-txt">#text#</span>',
                    '<a href="#" class="wzd-nevertip" title="���ò�����ʾ">������ʾ</a>',
                '</div>',
            '</div><div></div>'
        ].join('');
        var text = '';

        // ��ȡҳ������ű���
        var _ratio = ZoomDetect.detect();
        // ���ڴ���Ϊ����󻯵�����£�����ּ�����������Ҫ����һ���������ֵ
        _ratio = _ratio < 0.95 ? _ratio : (_ratio > 1.05 ? _ratio : 1);
        if(_ratio == 1) {
            // ҳ������
            text = '���������Ŀǰ��������������'
        }else{
            // ҳ�治����
            var tip = _ratio > 1 ? '�Ŵ�' : '��С';
            var controlKey = (navigator.platform.toLowerCase().indexOf('mac') > -1) ? 'command' : 'Ctrl';
            text = '�������������<q class="x-tip">' + tip + '</q>״̬��' + tip
                + '����Ϊ' + String(_ratio * 100).substr(0,6) + '%��'
                + '����ܻᵼ����ʾ���������������ڼ����ϰ�<q class="x-key">' + controlKey
                + '+����0</q>�ָ�����������'
        }

        var elBanner = $('.mod-zoomdetect');
        var btnClose = $('.mod-zoomdetect .wzd-close');
        if(!elBanner[0]) {
            // ����ڵ㣺��ʾ
            elBanner = $(_html.replace('#text#',text)).prependTo('body').attr('data-ratio',_ratio).hide();
            // �رհ�ť / ������ʾ
            elBanner.find('.wzd-btnclose,.wzd-nevertip').click(function(e){
                elBanner.slideUp(200);
                if(_intervalId != undefined) {
                    _stop();
                }
                // ������ʾ
                if($(this).hasClass('wzd-nevertip')) {
                    CookieHandler.set({
                        key : '_wzd_nevertip_',
                        value : 1
                    });
                }
                e.stopPropagation();
                e.preventDefault();
            });
        }else{
            var _preRatio = parseFloat(elBanner.attr('data-ratio'),10);
            // ������ʾ�İ�
            if(_preRatio != _ratio) {
                elBanner.attr('data-ratio',_ratio).find('.wzd-txt').html(text);
            }
        }
        if(_ratio == 1) {
            elBanner.slideUp(200);
        }else{
            elBanner.slideDown(200);
        }
    };

    /**
     * ��ҳ���ż��
     * @param       {Object}    configs    ����ҳ�����ż���������
     * @p-config    {Boolean}   always     �����ں�̨����ҳ�����ż�⣺ÿ��һ��ʱ���Զ����һ��
     *                                      Ĭ�ϣ�true������Ϊfalseʱ��ʾֻ���һ��
     * @p-config    {Integer}   interval   �Զ�����ʱ������Ĭ�ϣ�500ms
     */
    var _start = function(configs){
        configs = configs || {};

        // ��������������У��Ͳ�����������
        if(_running) return ;
        _running = true;

        // ���ȼ�⵱ǰ������Ƿ�֧��
        if(ZoomDetect.support()) {
            if(configs.always != false) {
                if(!CookieHandler.get('_wzd_nevertip_')) {
                    _intervalId = window.setInterval(_detect,configs.interval || 500)
                }
            }else{
                _detect();
            }
            $(window).blur(function(e){
                _stop();
            }).focus(function(e){
                _start();
            });
        }
    };

    /**
     * ֹͣ���
     */
    var _stop = function(){
        if(_intervalId != undefined) {
            window.clearInterval(_intervalId);
            _running = false;
        }
    };


    return {
        version : '1.2',
        start : _start,
        stop : _stop
    };
})();
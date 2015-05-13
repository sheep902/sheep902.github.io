//格式化日期
Date.prototype.Format = function(fmt){ 
  var o = {   
    "M+" : this.getMonth()+1,                 //月份   
    "d+" : this.getDate(),                    //日   
    "h+" : this.getHours(),                   //小时   
    "m+" : this.getMinutes(),                 //分   
    "s+" : this.getSeconds(),                 //秒   
    "q+" : Math.floor((this.getMonth()+3)/3), //季度   
    "S"  : this.getMilliseconds()             //毫秒   
  };   
  if(/(y+)/.test(fmt))   
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));   
  for(var k in o)   
    if(new RegExp("("+ k +")").test(fmt))   
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));   
  return fmt;   
}; 
String.prototype.Format=function(fmt){
    if(this==='')return '';
};
String.prototype.hasString=function(source){
    if(typeof source == 'object'){
        for(var i= 0,j=source.length;i<j;i++)
            if(!this.hasString(source[i])) return !1;
        return !0;
    }
    if(this.indexOf(source) != -1) return !0;
};
String.prototype.len = function () {
    var a = (this || "").match(/[^\x00-\x80]/g);
    return this.length + (a ? a.length : 0)
};
String.prototype.cut = function (k) {
    var g = "..",
        d = [],
        l = "";
    if (!k) {
        return this.trim()
    }
    if (this.len() > k) {
        for (var e = this.split(""), l = 0, i = e.length; l < i; l++) {
            if (0 < k) {
                d.push(e[l]), k -= e[l].len()
            } else {
                break
            }
        }
        l = d.join("") + g
    } else {
        l = this.trim()
    }
    return l
};
window.AM = window.AM || {};
window.AM = $.extend( window.AM, {
	i18n:'en',
	// url : {
	// 	lang: contextPath+'/client/clientAction/changeLanguage.go',
	// 	reqQuery: contextPath + '/resource/ResourceAction/query.go',
	// 	menuPriv: contextPath + '/common/CommonAction/amAuthComp.go'
	// },
    errorTip:function($modal,err){
        $modal.open({
          templateUrl: 'mainError.html',
          width:400,
          controller: function($scope,$modalInstance){
            $scope.ok = function () {
                $modalInstance.dismiss('cancel');
            };
            $scope.errorMsg=err||'Error~';
          }
        });
    },
    /**
     * 用法:
     * AM.tooltip($modal,{
            title:'BUSSINESS',
            buttonTitle:'ERROR',
            param:{},
            content:'FLOWS_RUNTIME_INFORMATION',或 '<input ng-model="param.xxx" type="text"/>{{"FLOWS_RUNTIME_INFORMATION" | translate}}',
            buttonOKTitle:'OK',
            ok:function(scope){
                console.log(scope.param);
            }
       });
     * @param $modal
     * @param obj {Object}
     *         content          内容显示 接受国际化 或 html片段
     *         param            当content中添加表单 提供额外的参数 （可选）
     *         width            宽度 （可选）
     *         title            标题 （可选）不填时不显示标题栏 接受国际化
     *         buttonTitle      按钮取消标题（可选 默认 “我知道了”）接受国际化
     *         buttonOKTitle    按钮确定标题（可选 默认 “我知道了”）接受国际化
     *         ok               回调方法 提供内部scope参数
     *
     *
     */
    tooltip:function($modal,obj){
        obj=obj||{};
        $modal.open({
            templateUrl: 'tooltip.html',
            width:obj.width||400,
            controller: function($scope,$modalInstance){
                $scope.cancel = function () {
                    if(obj.cancel)obj.cancel($scope);
                    $modalInstance.dismiss('cancel');
                };
                $scope.ok = function () {
                    if(obj.ok)obj.ok($scope);
                };
                $scope.obj=obj;
                $scope.param=obj.param||{};
                $scope.$watch('param',function(a,b){
                   if(a!=b){
                       $scope.param=a;
                   }
                },true);
            }
        });
    },
	Class:{
	    //create a class, and setup constructor
	    create: function() {
	        var f = function() {
	            this.init.apply(this, arguments);
	        };
	        for (var i = 0, il = arguments.length, it; i<il; i++) {
	            it = arguments[i];
	            if (it == null) continue;
	            $.extend(f.prototype, it);
	        }
	        return f;
	    }
	},
    b:function(){
        var b = {},
            c = navigator.userAgent;
        b.win = c.hasString("Windows") || c.hasString("Win32");
        b.ie = c.hasString("MSIE");
        b.ie6 = c.hasString("MSIE 6") && !c.hasString("MSIE 7") && !c.hasString("MSIE 8");
        b.ie7 = c.hasString("MSIE 7") && !c.hasString("MSIE 8");
        b.ie8 = c.hasString("MSIE 8");
        b.ie9 = c.hasString("MSIE 9");
        b.ie10 = c.hasString("MSIE 10");
        b.opera = window.opera || c.hasString("Opera");
        b.safari = c.hasString("WebKit");
        b.chrome = c.hasString("Chrome");
        b.firefox = c.hasString("Firefox");
        return b
    }(),
    //依赖 underscore
    encode:function(b){
        var c=[],
            f =_.isArray(b);
        if (_.isObject(b)){
            if (null === b) return "null";
            if (window.JSON && window.JSON.stringify) return JSON.stringify(b);
            for (var h in b) c.push((f ? "" :'"' + h + '":') + this.json2str(b[h]));
            c=c.join();
            return f ? "[" + c + "]" :"{" + c + "}"
        }
        return _.isNumber(b) ||_.isFunction(b) ? b.toString() :
            _.isUndefined(b) ? "undefined" :!b ? '""' :'"' + b + '"'
    },
    decode:function(b){
    	return this.util.json( b );
    },
	util:{
        parseUrl:function(a, b) {
            var c = a ? a: document.location.href;
            a = {};
            b = b || "?";
            if (!c.hasString(b)) return a;
            b = c.split(b)[1].split("&");
            for (c = 0; c < b.length; c++) {
                var e = b[c].replace(/#.*$/g, "").split("=");
                e[1] || (e[1] = "");
                a[e[0]] =e[1];
            }
            return a
        },
		isEmpty:function(val){
			if(val == undefined || val == null){
				return true ;
			}
			
			if('string' == typeof val){
				return (val.trim() == '') ;
			}
			
			if('object' == typeof val && val instanceof Array){
				return val.length == 0;
			}
			return false;
		},
        selectText:function (a,f,j){
            try{
                a.focus();
                if (document.createRange) a.setSelectionRange(f,j);
                else {
                    a = a.createTextRange();
                    a.collapse(1);
                    a.moveStart("character", f);
                    a.moveEnd("character", j - f);
                    a.select();
                }
            } catch (b) {}
        },
		bind:function(fn,scope){
            var _args=arguments.length>2?[].slice.call(arguments,2):null;
            return function(){
                var args=_args?_args.concat([].slice.call(arguments,0)):arguments;
                return fn.apply(scope||fn,args)
            }
        },
	    json:function(b){
	        var c={};
	        try {
	            c=eval("(" + b + ")")
	        } catch (f){}
	        return c
	    },
        url:function(a,b,c){
            return [a,(a.hasString("?") ? "&": "?"),b?this.toParm(b):'',c?'':'&_r='+new Date().getTime()].join('')
        },
        toParm:function(a){
            if(_.isObject(a)){
                var b=[];
                for (var c in a) b.push(c+'='+a[c]);
                return b.join('&');
            }
            return a;
        },
        json2str:function(b){
            var c=[],
                f =_.isArray(b);
            if (_.isObject(b)){
                if (null === b) return "null";
                if (window.JSON && window.JSON.stringify) return JSON.stringify(b);
                for (var h in b) c.push((f ? "" :'"' + h + '":') + this.json2str(b[h]));
                c=c.join();
                return f ? "[" + c + "]" :"{" + c + "}"
            }
            return _.isNumber(b) ||_.isFunction(b) ? b.toString() :
                _.isUndefined(b) ? "undefined" :!b ? '""' :'"' + b + '"'
        },
		format:function(args){
	        if(1==arguments.length) return args;
	        var arr=Array.prototype.slice.call(arguments,1);
	        return args.replace(/\{(\d+)\}/g,function(a,b){
	            return arr[b]
	        })
	    },
    	evt:function(b){
	        b = window.event || b || {};
	        return {
	            stop: function () {
	                b && b.stopPropagation ? b.stopPropagation() : b.cancelBubble = !0
	            },
	            prevent: function () {
	                b && b.preventDefault ? b.preventDefault() : b.returnValue = !1
	            },
	            target: b.target || b.srcElement,
	            x: b.clientX || b.pageX,
	            y: b.clientY || b.pageY,
	            button: b.button,
	            key: b.keyCode,
	            shift: b.shiftKey,
	            alt: b.altKey,
	            ctrl: b.ctrlKey,
	            type: b.type,
	            wheel: b.wheelDelta / 120 || -b.detail / 3
	        }
    	}
	}
});
angular.module('test.directives', ['vb'])
    .directive('paymentShow', ['$compile', '$translate', '$timeout', '$document','$filter',
        function ($compile, $translate, $timeout, $document,$filter) {
            return{
                restrict: 'EA',
                replace: true,
                scope: {
                    data: "=",
                    measureName:"="
                },
                template: '<ul class="payment_list" ng-style="{width:parentW}">' +
                    '<li ng-repeat="item in payList track by $index" class="status-{{item.status}}"' +
                    'ng-style="{width:item.width ||width}"><a><div ng-style="{height:height}" title="{{item[asValue]|number:2}}{{measureName}}">' +
                    '<p><span class="ppyFee">{{item.ppyFee|number:2}}/</span>{{item[asValue]|number:2}}</p></div>' +
                    '<p ng-show="item.showTime" class="mt10 due-time">{{item.showDate}}</p></a>' +
                    '</li></ul>',
                link: function (scope, element, attr) {
                    var minW = attr.minWidth || 105,  //最小宽度
                        h = attr.perHeight || 60,    //高度
                        parentDom = $(element).parent() ,
                        parentW = parentDom.width(),
                        asValue = attr.asValue || "value",  // 金额对应字段
                        minAmount = 99999999 ,
                        isEqualWidth = attr.equalWidth === "false" ? false : true,
                        totalAmount = 0 ,
                        dateKey = attr.dateKey || "endDate" ,
                        currentCount = +attr.currentCount;
                    scope.height = h;
                    scope.width = 60;

                    scope.asValue = asValue;
                    scope.timeoutId  = null ;
                    //格式 ，初始化数据
                    var formatData = function(list){
                        // status 0 :未支付 1：已支付 2：当前支付 3：提前支付一部分
                        var payList = angular.copy(list);
                        angular.forEach(payList,function(item,index){
                            if(!item.isBilled){
                                item.status = 0 ;
                            }
                            if(item.isPaid){
                                item.status = 1 ;
                            }
                            if(item.isBilled && !item.isPaid){
                                item.status = 2;
                            }
                            if(item.ppyFee && item.ppyFee !== item.amount){
                                item.status = 3 ;
                            }
                            if(index ==0 || item.status == 2 || index == (list.length-1)){
                                item.showTime = true;
                            }
                            item.showDate = $filter("i18nDateFilter")(item[dateKey],"s");

                        });
                        scope.payList = payList;
                        $timeout(function(){
                        	$("body").css({visibility:"visible"});
                        });
                        },
                    getMinAmount = function () {
                        angular.forEach(scope.data, function (item) {
                            totalAmount += item[asValue];
                            if (item[asValue] < minAmount) {
                                minAmount = item[asValue];
                            }
                        });
                    },
                        computeUnEqualWidth = function () {
                            getMinAmount();
                            var width = Math.max(parentW * minAmount / totalAmount, minW),
                                multi = 1,
                                totalWidth = 0;

                            angular.forEach(scope.data, function (item) {
                                item['width'] = width * item[asValue] / minAmount;
                                totalWidth += item['width'];
                            });
                            multi = Math.ceil(totalWidth / parentW);
                            width = minAmount * multi * parentW / totalAmount;
                            angular.forEach(scope.data, function (item) {
                                item['width'] = width * item[asValue] / minAmount;
                            });
                            formatData(scope.data) ;

                        };
                    var computeEqualWidth = function () {
                            var length = scope.data.length;
                            scope.width = length > 13 ? parentW / 12 : parentW / length;
                            scope.width = Math.min(parentW/2, scope.width)-1;
                            scope.width = Math.max(minW,scope.width);
                            formatData(scope.data) ;
                        },
                        init = function (isInit) {
                            if(scope.timeoutId != null){
                                 $timeout.cancel(scope.timeoutId );
                            }
                            if(parentW == $(element).parent().width() && !isInit ){
                                return ;
                            }
                            scope.timeoutId = $timeout(function(){
                                parentW = $(element).parent().width();
                                if (scope.data.length) {
                                    if (isEqualWidth) {
                                        computeEqualWidth();
                                    } else {
                                        computeUnEqualWidth();
                                    }
                                }
                                $timeout.cancel(scope.timeoutId )
                            },100);
                        } ;

                    $(window).bind("resize",init);
                    scope.$watch("data",function(){
                        init(true);
                    });
                    scope.$on('$destroy', function () {
                        $(window).unbind('resize', init);
                        $timeout.cancel(scope.timeoutId )
                    });
                }
            }
        }])

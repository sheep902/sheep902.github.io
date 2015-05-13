vbModule.config(['$urlRouterProvider','$stateProvider',function($urlRouterProvider,$stateProvider){
    $urlRouterProvider.otherwise('test');
    $stateProvider
        //订购分期 新  upc.controller.js
        .state('test',{
            url:"/test",
            views:{
                'main':{
                    templateUrl:'ng-views/test.html',
                    controller:"test"
                }
            }
        })
        .state('queryAdjustmentHistoryCtrl',{
            url:"/queryAdjustmentHistoryCtrl",
            views:{
                'main':{
                    templateUrl:'ng-views/queryAdjustmentHistory.html',
                    controller:"queryAdjustmentHistoryCtrl"
                }
            }
        })
        .state('paymentHistoryQueryCtrl',{
            url:"/paymentHistoryQueryCtrl",
            views:{
                'main':{
                    templateUrl:'ng-views/paymentHistoryQuery.html',
                    controller:"paymentHistoryQueryCtrl"
                }
            }
        })
}])
.run(['$rootScope','$state', '$stateParams','$translate',
    function($rootScope, $state, $stateParams,$translate) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.contextPath = contextPath;
        $rootScope.$on('$stateChangeSuccess',function(event, toState, toParams, fromState, fromParams){
        	$stateParams.lang=$translate.use();
            if((!window.businessType) || (window.businessType == "")){
            	window.businessType = $stateParams.businessType;
            }
            if((!window.businessId) || (window.businessId == "")){
            	window.businessId = $stateParams.businessId;
            }
            //HACK ai框架 url 间参数传递
            var key ;
//            for(key in  $stateParams){
//                Ai.Request.setParameter(key,$stateParams[key]);
//            }
//            if(toState.name == "instalment"){
//                if((!window.businessType) || (window.businessType == "")){
//                    window.businessType = 2;
//                }
//                if((!window.businessId) || (window.businessId == "")){
//                    window.businessId = $stateParams.acctId;
//                }
//                Ai.Request.setParameter("businessId",2);
//                Ai.Request.setParameter("businessKey",$stateParams.acctId);
//
//            }
        });
    }
]);

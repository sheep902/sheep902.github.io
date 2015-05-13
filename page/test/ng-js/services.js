angular.module('test.services', [])
    .config(function($httpProvider){
        $httpProvider.interceptors.push(function($q, $rootScope) {
            $rootScope.$on("loading-started", function(e) {
                $(".ajax_bg_a").show();

            });

            $rootScope.$on("loading-complete", function(e) {
                $(".ajax_bg_a").hide();
            });
            return {
                'request': function(config) {
                    $rootScope.$broadcast('loading-started');
                    return config || $q.when(config);
                },
                'response': function(response) {
                    $rootScope.$broadcast('loading-complete');
                    return response || $q.when(response);
                }
            };
        });
    })
    .factory('installServices', ['$http', '$q',function($http, $q) {
        var U=AM.util;
    	var URL = {
            dunningRecover:contextPath + '/instal/InstalAction/dunningRecover.go'
        };
        //$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
        //demo
        //通用的Get方式的异步ajax请求  queryStringParam:{}
        var commGetXHR = function(url, queryStringParam){
            var def=$q.defer();
            $http.get(U.url(url, queryStringParam)).then(def.resolve,def.reject);
            return def.promise;
        };

        //通用的Post方式的异步ajax请求
        var commPostXHR = function(url, postParam){
            var def=$q.defer();
            $http.post(url, postParam).then(def.resolve,def.reject);
            return def.promise;
        };

        return {

            dunningRecover:function(a){
                var def=$q.defer();
                $http.post(URL.dunningRecover,a).then(def.resolve,def.reject);
                return def.promise;
            },
            getJson:function(a){
                var def=$q.defer();
                var url = "data.json ";
                $http.get(url, a).then(def.resolve,def.reject);
                return def.promise;
            }

        };
    }]);

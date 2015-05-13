/*
    createTime:2015-1-25
    createBy:Wu LingYang
    QQ：915064510
*/
app.controller('test', ['$scope','$timeout','$modal','$rootScope','$stateParams','$translate','$location','dialogs','$filter','installServices',
    function ($scope,$timeout,$modal,$rootScope,$stateParams,$translate,$location,dialogs,$filter,installServices){

      var test = function(){
         installServices.getJson().then(function(a){
            var data = a.data ;
            if(!data.success){
              return ;
            }
           $scope.tableData = data.data; 
         });

      };

      test();



    }]);
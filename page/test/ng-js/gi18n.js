vbModule.config(['$translateProvider', function($translateProvider) {

	$translateProvider.translations('en', {

        //-----------------------payment----------------------------------
        'PAYMENT':'Payment',
        'PAYMENT_TYPE':'Payment Type',
        'PAYMENT_AMOUNT':'Payment Amount',
        'PAY':'Pay',
        'CONFIRM':'Confirm',
        "CANCEL":'Cancel',
        'PAY_DIA_CONTEXT':'Please make sure to submit',
        'ACCOUNT_ID':'Account ID',
        'INVOICE_NO':'Invoice No.',
        'PHONENUMBER':'phoneNumber'
        //-----------------------payment----------------------------------
	})
        .translations('zh_CN', {

        //-----------------------payment----------------------------------
        'PAYMENT':'缴费',
        'PAYMENT_TYPE':'缴费类型',
        'PAYMENT_AMOUNT':'缴费金额',
        'PAY':'支付',
        'CONFIRM':'确认',
        "CANCEL":'取消',
        'PAY_DIA_CONTEXT':'请确认是否要提交',
        'ACCOUNT_ID':'账户编号',
        'INVOICE_NO':'发票号码',
        'PHONENUMBER':'手机号码'
        //-----------------------payment----------------------------------

	});
	$translateProvider.preferredLanguage(lang || 'en');
}]);

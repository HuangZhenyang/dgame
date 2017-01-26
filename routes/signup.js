var express = require('express');
var router = express.Router();
var config = require('./../config/default');
var Userjs = require('./../models/users');
var Functions = require('./../models/functions');
var User = require('./../lib/mongo').User;
var App = require('alidayu-node');
var async = require('async');
var app = new App(config.AppKey, config.AppSecret);
//该code最好随机生成
var code = '123456';

router.get('/',function(req,res,next){
	res.render('signup');
})

router.post('/',function(req,res,next){

	if(req.body.username.length>11 || req.body.username === ''){
		res.send('username');
	}else if(req.body.password.length<6 || req.body.password.length>16){
		res.send('password');
	}else if(req.body.tele.length !== 11){
		res.send('tele');
	}else if(req.body.code !== code){
		res.send('code');
	}else{
		var usersMsg = [];

		async.series([function(callback){
			/*
			 *系统使用电话号码和密码唯一标志一个用户
			 *如果数据库中该电话号码已被注册，则返回错误代码，提醒用户重新输入
			 */
			User.findOne({tel:req.body.tele},function(err,user){
				if(!err){
					//若该号码已被注册
					if(!Functions.isEmptyObject(user)){		
						console.log("该电话已被注册");
						res.send("tele-repeat");
					}else{
						req.session.user = user;
						callback(null,'one');
					}

				}else{
					console.log("something wrong in User.find()!");
				}
			})

		},function(callback){
			req.session.sign = true;

			res.end('success');
		}],function(err,data){
			if(err){
				console.log('async error in signup/router.post happened!');
			}
		})
}

})

router.post('/identify',function(req,res,next){
	//这里让验证码强制等于123456，以后通过生成随机数来验证
	//console.log("sendsms..."+"AppKey: "+config.AppKey+"AppSecret: "+config.AppSecret);
	//console.log("手机号："+req.body.tele);
	code = '123456';
	app.smsSend({
    	sms_free_sign_name: config.sms_free_sign_name, //短信签名
    	sms_param: JSON.stringify({"code": code, "name": "用户"}),//短信变量，对应短信模板里面的变量
    	rec_num: req.body.tele, //接收短信的手机号
   		sms_template_code: config.sms_template_code //短信模板
    });
	res.send(true);
})

module.exports = router;
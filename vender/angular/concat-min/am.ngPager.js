AM.Pager=AM.Class.create({
    init:function(option){
        this.tpl={
            pager_item:'<a class="pager_item pagerNum" data="{0}" href="javascript:void(0)">{0}</a>',
            pager_cur:'<strong class="pagerNow" data="{0}">{0}</strong>',
            pager_dis:'<strong class="pager{0} pagerDis">{1}</strong>',
            pager_text:'<a class="pager_item pager{0}" data="{1}" href="javascript:void(0)">{2}</a>',
            pager_omiss:'<strong class="pageOmiss">&bull; &bull; &bull;</strong>'
        };
        this.i18n={
            'zh_CN':{
                first:'\u7b2c\u4e00\u9875',
                prev:'\u4e0a\u4e00\u9875',
                next:'\u4e0b\u4e00\u9875',
                last:'\u6700\u540e\u9875',
                total:'当前<span style="margin-right:10px;">{0}</span>  共 {1} 条'
            },
            'en':{
                first:'First',
                prev:'Pre',
                next:'Next',
                last:'Last',
                total:'<span>{0}</span> of {1} services'
            }
        };
        
        var op=this.option=$.extend({
            el:null,
            current:1,//默认当前第1页
            type:1,//显示样式 1 精简  2 通用版
            i18n:lang||'en',
            angular:1,
            showTotal:0,//是否显示总数
            page:null,//总页数
            pageSize:null,//每页总条数
            count:null,//总条数
            onPager:null //点击回调
        },option||{});
        op.page=op.page||0;
        // if(op.page<1)return;
        this._config(op.i18n);
        this._createHTML();
        if(op.page) this._refreshPager();
    },
    _config:function(a){
        this.config={
            pager_text:this.i18n[a],
            pager_total:this.i18n[a].total,
            pager_selector:'a.pager_item',
            show_num:5
        };
    },
    _createHTML:function(){
        if(!this.el){
            this.el=$('<div class="am_pager"><div class="am_pager_add"></div><div class="am_pager_inner"></div></div>');
            if(this.option.type===1){
                this.el.addClass('am_pager_simple')
            }
            this.inner=this.el.children();
            $(this.option.container||document.body).append(this.el);
            this._initListener();
        }
    },
    _initListener:function(){
        var U=AM.util;
        if(this.option.angular)
            this.el.bind('click',U.bind(function(e){
                var el=$(e.target);
                if(el[0].tagName=="A" && el.hasClass('pager_item')){
                    var data=el.attr('data');
                    if(data) this._activePager(data>>0);
                }
            },this));
    },
    addLoad:function(el){
        el=this.wrap=$(el);
        if(!el)throw 'not found element!';
        var w=el.width(),h=el.height();
        this.load=$('<div class="am_pager_load" style="width:'+w+'px; height:'+h+'px;position:absolute;left:0px;top:0px;');
        el[0].style.cssText='position:relative;';
        el.append(this.load);
    },
    removeLoad:function(){
        this.wrap[0]&&(this.load.remove(),this.wrap[0].style.cssText='');
    },
    setPage:function(page){
        this._createHTML();
        this.option.page=page;
    },
    setCurrent:function(current){
        this.option.current=current;
        this._refreshPager();
    },
    active:function(num){
        if(num<1 || num>this.option.page) return;
        this._activePager(num);
    },
    _refreshPager:function(){
        var U=AM.util;
        var html=[],
            op=this.option,
            tpl=this.tpl;
            this._config(op.i18n);
        var txt=this.config.pager_text;
        if(op.showTotal!==1){
            if(op.showTotalType===1){
                if(Math.ceil(op.count/op.pageSize)<2){
                    this.inner[0].innerHTML='';
                }else{
                    this.inner[0].innerHTML=['<span>',op.current,'/',Math.ceil(op.count/op.pageSize),'</span>'].join('')
                }
            }else{
                if(op.count<1){
                    this.inner[0].innerHTML=['0 ',this.config.pager_total.split(/\s/).slice(-1)].join('');
                }else{
                    this.inner[0].innerHTML=U.format(this.config.pager_total,function(){
                        var a=(op.current-1)*op.pageSize+1,
                            b=function(){
                                var _b=op.current*op.pageSize;
                                return (_b<=op.count)?_b:(op.count%op.pageSize+(op.current-1)*op.pageSize)||0;
                            }();
                        return b>0?[a,'-',b].join(''):b;
                    }(),op.count||0);
                }
            }
        }
        if(op.type>1){
            if(txt.first&&op.current>1 && op.page>1){
                html.push(U.format(tpl.pager_text,'First','1',txt.first));
            }else {
                html.push(U.format(tpl.pager_dis,'First',txt.first));
            }
        }
        if(txt.prev&&op.current>1 && op.page>1)
            html.push(U.format(tpl.pager_text,'Prev',op.current-1,txt.prev));
        else html.push(U.format(tpl.pager_dis,'Prev',txt.prev));
        if(op.type===2){
            var l=this._getListPage();
            if(l.start>1)
                html.push(tpl.pager_omiss);
            for(var i=l.start;i<=l.end;i++){
                if(i==op.current){
                    html.push(U.format(tpl.pager_cur,i));
                }
                else
                    html.push(U.format(tpl.pager_item,i));
            }
            if(l.end<op.page) html.push(tpl.pager_omiss);
        }
        if(txt.next&&op.current<op.page)
            html.push(U.format(tpl.pager_text,'Next',op.current+1,txt.next));
        else html.push(U.format(tpl.pager_dis,'Next',txt.next));
        if(op.type>1){
            if(txt.last&&op.current<op.page){
                html.push(U.format(tpl.pager_text,'Last',op.page,txt.last));
            }else{
                html.push(U.format(tpl.pager_dis,'Last',txt.last));
            } 
        }                
        this.inner[1].innerHTML=op.page>1?html.join(''):'';
    },
    _getListPage:function(){
        var start= 0,
            end= 0,
            op=this.option,
            conf=this.config;
        if(op.page<=conf.show_num){
            start=1;
            end=op.page;
        }else{
            start=op.current-Math.floor(conf.show_num/2);
            if(start<1) start=1;
            end=start+conf.show_num-1;
            if(end>op.page){
                start-=end-op.page;
                end=op.page;
            }
        }
        return{
            start:start,
            end:end
        }
    },
    _activePager:function(num){
        var op=this.option;
        if(op.current==num)return;
        op.current=num;
        this._refreshPager();
        if(op.onPager) op.onPager(num,this);
    },
    destroy:function(){
        this.el.unbind('click');
        this.el=null;
    }
});

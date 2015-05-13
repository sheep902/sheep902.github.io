/**
 * Created by Administrator on 2014/11/24.
 */
(function($, R) {

    var lineOpts = {
        stroke: ['#558eff','#9141ba','#d15252','#1a7f4f','#ffcc00'], // 折线图折线的颜色
        strokeWidth: 2 // 折线的线宽
    };

    var line = function(opts) {
        var me = this;
        if (!(me instanceof Mix.line)) {
            return new Mix.line(opts);
        }
        opts = me.opts = $.extend(true, {}, lineOpts, opts || {});
    };
    line.prototype = {
        constructor: line,
        draw: function(g) {
            var me = this, gOpts = g.opts, data = g.data, dataLen = data.length, xgrid = g.grid.x,
                path, i,labels=gOpts.data.labels||[], j, x, y, line, dot, d,
                subbarWidth = (g.box.barwidth - g.opts.gap * (dataLen - 1)) / dataLen;

            g.graphs.lines = g.paper.set();
            g.graphs.dots = g.paper.set();
            // console.log('-------------------------------');
            // console.log(data);
            var _index,
                color,
                xkey=gOpts.data.xkey,
                ykey=gOpts.data.ykey,
                _labels=function(){//计算 x轴的 所有显示数据
                    var d=[];
                    for(var i=0;i<dataLen;i++){
                        d=d.concat(_.pluck(data[i],xkey));
                    }
                    return _.uniq(d).sort();
                }(),
                l=_labels.length,
                unitW=g.box.width / (l - 1);//计算x轴之间的跨度
            //       console.log('dataLen:'+dataLen);
            //       console.log(_labels);
            for (j=0;j<dataLen;j++) {
                color=(typeof me.opts.stroke ==='string' ? me.opts.stroke : me.opts.stroke[j] || me.opts.stroke[0]);
                path = [];

                for (i = 0; i < l; i++){
                    d = data[j][i];
                    if (!d) continue;
                    _index=_.indexOf(_labels,d[xkey]);

                    x = g.hasbar ? xgrid[i] + g.box.left - g.box.barwidth / 2
                        + subbarWidth / 2  + (subbarWidth + g.opts.gap) * j : x = _index * unitW + g.box.left;
                    x=x||g.box.left;//修改于2014-4-15 by Marshane

                    y = g.box.bottom - ((d[ykey] * g.box.dy)||0);
                    path.push(i ? 'L' : 'M', x, ',', y);

                    dot = me.drawDot(g.paper, x ,y,color);

                    g.graphs.dots.push(dot);
                    if (gOpts.tip) {
                        dot.hover(function(dot) {
                            var dd = data[j][i];
                            return function() {
                                dot.animate(Raphael.animation({r: 8}, 25, 'linear'));
                                //                  dot.toFront();
                                if(!me.tipElem){
                                    me.tipElem=$('<div class="amchart-line-hover"><div>');
                                    g.el.append(me.tipElem);
                                }
                                gOpts.tip(me.tipElem, dd,dot.attr('cx'),dot.attr('cy'));
                            };
                        }(dot), function(dot) {
                            return function(){
                                if(me.tipElem){
                                    me.tipElem.hide();
                                }
                                dot.animate(Raphael.animation({
                                    r:4
                                }, 25, 'linear'));
                            }
                        }(dot));
                    }
                }
                line = g.paper.path(path.join('')).attr({
                    'stroke': color,
                    'stroke-width': me.opts.strokeWidth
                });
                g.graphs.lines.push(line);
            }
        },

        drawDot: function(paper, x, y,color) {
            var me = this;
            return paper.circle(x, y, 4).attr({
                'fill':color,
                'stroke':'#fff',
                'stroke-width':1
            });
        }
    };

    Mix.line = line;

    var barOpts = {
        // 柱形图柱子的颜色
        //      stepColors:['#558eff','#9141ba','#d15252','#1a7f4f','#ffcc00']

        stepColors: ['#085bc1','#33cccc','#205ca5','#00bae9','#3bfaef','#d15252','#067cf5',
            '#558eff','#6dabde','#108178','#0ca99c','#1cc3b6']
    };

    var bar = function(opts) {
        var me = this;

        if (!(me instanceof Mix.bar)) {
            return new Mix.bar(opts);
        }
        opts = me.opts = $.extend(true, {}, barOpts, opts || {});
    };

    bar.prototype = {
        constructor: bar,

        draw: function(g) {
            var me = this, gOpts = g.opts, data = g.data, dataLen = data.length,
                xgrid = g.grid.x,
                rect, i, l = gOpts.data.labels.length, j, x, y, w, h, bar, bars, xval, yval, k, xPos, yPos, totalVal,
                subbarWidth = (g.box.barwidth - g.opts.gap * (dataLen - 1)) / dataLen;

            g.graphs.bars = g.paper.set();
            for (j = dataLen - 1; j >= 0; j--) {
                for (i = 0; i < l; i++) {
                    totalVal = 0;
                    if (gOpts.horizontal) {
                        if (!data[j][i]) continue;
                        yval = data[j][i][gOpts.data.ykey];
                        xval = data[j][i][gOpts.data.xkey];

                        if (R.is(yval, 'array')) {
                            xPos = 0;
                            y = xgrid[i] + g.box.top - g.box.barwidth / 2  + (subbarWidth + g.opts.gap) * j;
                            h = subbarWidth;

                            for (k = 0; k < yval.length; k++) {
                                totalVal += yval[k];
                                w = yval[k] * g.box.dy;
                                xPos += w;
                                x = g.box.left + xPos - w;
                                bar = g.paper.rect(x, y, w, h).attr({
                                    'fill': me.opts.stepColors[k],
                                    'stroke-width': 0
                                });

                                bar.data('yval', yval);
                                bar.data('xval', xval);
                                g.graphs.bars.push(bar);
                            }
//              if(totalVal > 0) {
//              	g.paper.text(x+w+5, y+h/2, totalVal).attr('fill', '#fff').attr('text-anchor', 'start');
//              }
                        }
                        else {
                            x = g.box.left;
                            y = xgrid[i] + g.box.top - g.box.barwidth / 2  + (subbarWidth + g.opts.gap) * j;
                            w = yval * g.box.dy;
                            h = subbarWidth;
                            bar = g.paper.rect(x, y, w, h).attr({
                                'fill': me.opts.stepColors[dataLen === 1 ? i : j],
                                'stroke-width': 0
                            });

//              if(yval > 0) {
//              	g.paper.text(x+w, y, yval).attr('fill', '#fff').attr('text-anchor', 'start');
//              }

                            bar.data('yval', yval);
                            bar.data('xval', xval);
                            g.graphs.bars.push(bar);
                        }
                    }
                    else {
                        if (!data[j][i]) continue;
                        yval = data[j][i][gOpts.data.ykey];
                        xval = data[j][i][gOpts.data.xkey];

                        if (R.is(yval, 'array')) {
                            yPos = 0;
                            x = xgrid[i] + g.box.left - g.box.barwidth / 2 + (subbarWidth + g.opts.gap) * j;
                            w = subbarWidth;
                            for (k = 0; k < yval.length; k++) {
                                totalVal += yval[k];
                                yPos += yval[k] * g.box.dy;
                                y = g.box.bottom - yPos;
                                h = Math.ceil(yval[k] * g.box.dy);
                                if(gOpts.abreast){

                                    bar = g.paper.rect(x, y, w, h).attr({
                                        'fill': me.opts.stepColors[j],
                                        'stroke-width': 0,
                                        'stroke': me.opts.stepColors[j]
                                    });
                                }else{
                                    bar = g.paper.rect(x, y, w, h).attr({
                                        'fill': me.opts.stepColors[k],
                                        'stroke-width': 0,
                                        'stroke': me.opts.stepColors[k]
                                    });
                                }


                                bar.data('yval', yval);
                                bar.data('xval', xval);
                                g.graphs.bars.push(bar);
                            }
//              if(totalVal > 0) {
//              	g.paper.text(x+w/2, y-10, totalVal).attr('fill', '#fff');;
//              }
                        }
                        else {
                            x = xgrid[i] + g.box.left - g.box.barwidth / 2 + (subbarWidth + g.opts.gap) * j;
                            y = g.box.bottom - yval * g.box.dy;
                            w = subbarWidth;
                            h = g.box.bottom - y;
                            if(gOpts.abreast){
                                bar = g.paper.rect(x, y, w, h).attr({
                                    'fill': me.opts.stepColors[dataLen === 1 ? 0 : j],
                                    'stroke-width': 0
                                });
                            }else{
                                bar = g.paper.rect(x, y, w, h).attr({
                                    'fill': me.opts.stepColors[dataLen === 1 ? i : j],
                                    'stroke-width': 0
                                });
                            }

//              if(yval > 0) {
//	              g.paper.text(x+w/2, y-10, yval).attr('fill', '#fff');;
//              }

                            bar.data('yval', yval);
                            bar.data('xval', xval);
                            g.graphs.bars.push(bar);
                        }
                    }
                }
            }

            if(gOpts.tip) {
                for(var i=0; i<g.graphs.bars.length; i++) {
                    var bar = g.graphs.bars[i];
                    bar.hover(function(data, xval) {
                        return function(event) {
                            if(!me.tipElem) {
                                me.tipElem = $('<div class="amchart-line-hover"><div>');
                                g.el.append(me.tipElem);
                            }
                            gOpts.tip(me.tipElem, data, xval, event.offsetX, event.offsetY);
                        }
                    }(bar.data('yval'), bar.data('xval')), function() {
                        if(me.tipElem) {
                            me.tipElem.hide();
                        }
                    });

                    bar.mousemove(function(event) {
                        if(me.tipElem) {
                            var x = event.offsetX;
                            var y = event.offsetY;
                            var ew = g.el.width();
                            var pw = me.tipElem.width();
                            var ph = me.tipElem.height();
                            var left, top;
                            left = function () {
                                var f = pw / 2 + 8;
                                var m = x - f;
                                if (m < 0) m = 0;
                                if ((x + f) > ew) m = ew - f * 2;
                                return m
                            }();
                            top = function () {
                                var f = y - ph - 27;
                                var m = f;
                                if (f < 0)m = y + 13;
                                return m;
                            }();

                            me.tipElem.css({'left': left, 'top': top}).show();
                        }
                    });
                }
            }
        }

    };

    Mix.bar = bar;



    var rad = Math.PI / 180;
    function sector(paper, cx, cy, r, startAngle, endAngle, params) {
        var x1 = cx + r * Math.cos(-startAngle * rad),
            x2 = cx + r * Math.cos(-endAngle * rad),
            y1 = cy + r * Math.sin(-startAngle * rad),
            y2 = cy + r * Math.sin(-endAngle * rad);
        return paper.path(["M",cx, cy ,"L", x1, y1, "A", r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2, "L", cx, cy]).attr(params);
    }

    var pieOpts ={

    };

    function Pie(opts) {
        var me = this;

        if (!(me instanceof Pie)) {
            return new Mix.Pie(opts);
        }
        opts = me.opts = $.extend(true, {}, barOpts, opts || {});

        // 通过id或者dom 生成jQuery对象
        me.el = typeof opts.element === 'string' ? $('#'+ opts.element) : $(opts.element);
        me.el.css('position', 'relative');

        opts.width = opts.width || me.el.width();
        opts.height = opts.height || me.el.height();
        me.paper = new R(me.el[0], opts.width, opts.height);

        me.init();
    }
    Pie.prototype = {
        constructor: Pie,
        init: function() {
            var me = this, opts = me.opts;

            me.calcBox();
            me.setData();

            me.draw();
        },
        update: function(data) {
            var me = this;
            me.paper.clear();
            me.opts.data=data;
            me.setData();
            me.draw();
        },
        calcBox: function() {
            var me = this, opts = me.opts, box = {},
                pd = opts.padding;

            box.top = pd;
            box.right = opts.width - pd;
            box.bottom = opts.height - pd;
            box.left = pd;

            box.width = box.right - box.left;
            box.height = box.bottom - box.top;

            box.cx = box.width / 2 + box.left;
            box.cy = box.height / 2 + box.top;
            box.r = Math.min(box.cx, box.cy) - opts.strokeWidth;

            me.box = box;
        },

        setData: function() {
            var me = this, opts = me.opts, data = opts.data,
                i, len = data.length, total = 0, j = 0, max = 0, yval;

            for (i = len - 1; i >= 0; i--) {
                total += data[i][opts.ykey];
            }

            for (i = len - 1; i >= 0; i--) {
                yval = data[i];
                yval.per = parseFloat((yval[opts.ykey] / total).toFixed(2));
                // yval.max = 0; // 给每个数据对象都添加一个max = 0的属性，并且后面设置最大的那个数据max属性值为1
                if (max < yval.per) {
                    max = yval.per;
                    j = i;
                }
            }
            data[j].max = true;
        },

        draw: function() {
            var me = this, opts = me.opts, data = opts.data, box = me.box,
                i, len = data.length, startAngle = 0, endAngle = 0,
                donut, donuts = me.paper.set(), item,
                w = (box.r * 2 - opts.strokeWidth) / Math.sqrt(2);
            var pWid,wid;
            if(!me.fixedEle){
                me.fixedEle=$('<div style="position: absolute; display:table"></div>');
                me.el.append(me.fixedEle);
                pWid=$(me.paper.canvas).parent().width()/2;
                wid=$(me.paper.canvas).width()/2;

                me.fixedEle.css({
                    'left':parseInt(box.cx - w/2+pWid-wid),
                    'top':parseInt(box.cy - w/2),
                    'width':parseInt(w),
                    'height':parseInt(w),
                    'text-align': 'center',
                    'overflow':'hidden'
                });
            }
            for (i = len - 1; i >= 0 ; i--) {
                item = data[i];
                startAngle = endAngle + 1;
                endAngle = startAngle + item.per * 360 - 1;

                donut = me.drawSector(box.cx, box.cy, box.r, startAngle, endAngle, {
                    //          'stroke': opts.stepColors[i],
                    //          'stroke-width': opts.strokeWidth
                    'fill': opts.stepColors[i]
                });

                me.drawLabel(data[i][opts.ykey], me.paper, box.cx, box.cy, box.r, startAngle, endAngle, opts.stepColors[i]);

                donut.data('data', item);
                donuts.push(donut);
            }
        },

        drawSector: function(x, y, r, startAngle, endAngle, attrs) {
            var me = this, opts = me.opts, donut;
            donut = sector(me.paper, x, y, r, startAngle, endAngle, attrs);

            return donut;
        },

        drawLabel: function(labelTxt, paper, cx, cy, r, startAngle, endAngle, color) {
            var x1 = cx + r * Math.cos(-(startAngle+endAngle)/2 * rad),
                y1 = cy + r * Math.sin(-(startAngle+endAngle)/2 * rad),
                x2 = cx + (r+15) * Math.cos(-(startAngle+endAngle)/2 * rad),
                y2 = cy + (r+15) * Math.sin(-(startAngle+endAngle)/2 * rad),
                x3, y3;

            if((startAngle+endAngle) / 2 > 90 && (startAngle+endAngle) / 2 < 270) {
                x3 = x2 - 15
                y3 = y2;
                paper.path(["M", x1, y1, "L", x2, y2, "L", x3, y3]).attr({
                    stroke: color
                });
                var t = paper.text(x3, y3, labelTxt).attr({
                    'fill': color,
                    'text-anchor': 'end'
                });
            }else {
                x3 = x2 + 15
                y3 = y2;
                paper.path(["M", x1, y1, "L", x2, y2, "L", x3, y3]).attr({
                    stroke: color
                });
                paper.text(x3, y3, labelTxt).attr({
                    'fill': color,
                    'text-anchor': 'start'
                });
            }
        }
    };

    Mix.Pie = Pie;
})(jQuery, Raphael);
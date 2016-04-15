/**
 * jqPlot
 * Pure JavaScript plotting plugin using jQuery
 *
 * Version: 1.0.9
 * Revision: ab1aa44
 *
 * Copyright (c) 2009-2016 Chris Leonello
 * jqPlot is currently available for use in all personal or commercial projects
 * under both the MIT (http://www.opensource.org/licenses/mit-license.php) and GPL
 * version 2.0 (http://www.gnu.org/licenses/gpl-2.0.html) licenses. This means that you can
 * choose the license that best suits your project and use it accordingly.
 *
 * Although not required, the author would appreciate an email letting him
 * know of any substantial use of jqPlot.  You can reach the author at:
 * chris at jqplot dot com or see http://www.jqplot.com/info.php .
 *
 * If you are feeling kind and generous, consider supporting the project by
 * making a donation at: http://www.jqplot.com/donate.php .
 *
 * sprintf functions contained in jqplot.sprintf.js by Ash Searle:
 *
 *     version 2007.04.27
 *     author Ash Searle
 *     http://hexmen.com/blog/2007/03/printf-sprintf/
 *     http://hexmen.com/js/sprintf.js
 *     The author (Ash Searle) has placed this code in the public domain:
 *     "This code is unrestricted: you are free to use it however you like."
 *
 */
(function($) {

    var isNumeric = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    /**
     * Class: $.jqplot.errorbarRenderer
     * jqPlot Plugin to draw error bars.
     *
     * To use this plugin, include the renderer js file in
     * your source:
     *
     * > <script type="text/javascript" src="plugins/jqplot.errorbarRenderer.js"></script>
     *
     * Then you set the renderer in the series options on your plot:
     *
     * > series: [{renderer:$.jqplot.errorbarRenderer}]
     *
     * Data must be supplied in one of these forms:
     *
     * > data = [[x1, y1, { xerr: xerr1,            yerr: yerr1            }, mask ], ...]
     * > data = [[x1, y1, { xerr: [xerr1l, xerr1h], yerr: [yerr1l, yerr1h] } ], ...]
     *
     */
    $.jqplot.errorbarRenderer = function() {
        // subclass line renderer to make use of some of it's methods.
        $.jqplot.LineRenderer.call(this);
        // prop: tickLength
        // length of the line in pixels indicating ends of the error bars.
        // Default will auto calculate based on plot width and
        // number of points displayed.
        this.tickLength = 'auto';
        // prop: maxColor
        // color of the max error tick mark.  Default is series color.
        this.maxColor = null;
        // prop: minColor
        // color of the min error tick mark.  Default is series color.
        this.minColor = null;
        // prop: barColor
        // color of the hi-lo line thorugh the candlestick body.
        // Default is the series color.
        this.barColor = null;
        // prop: mean
        // color of the hi-lo line thorugh the candlestick body.
        // Default is true.
        this.mean = true;
        // prop: meanColor
        // color of the hi-lo line thorugh the candlestick body.
        // Default is the series color.
        this.meanColor = null;
        // prop: errorBar
        // true to plot the line with LineRenderer on the series data
        // defaults to true
        this.errorBar = true;
        // prop: lineWidth
        // Width of the hi-low line and min/max ticks.
        // Must be set in the rendererOptions for the series.
        this.lineWidth = 1.5;
    };

    $.jqplot.errorbarRenderer.prototype = new $.jqplot.LineRenderer();
    $.jqplot.errorbarRenderer.prototype.constructor = $.jqplot.errorbarRenderer;

    // called with scope of series.
    $.jqplot.errorbarRenderer.prototype.init = function(options) {
        options = options || {};
        // lineWidth has to be set on the series, changes in renderer
        // constructor have no effect.  set the default here
        // if no renderer option for lineWidth is specified.
        this.lineWidth = options.lineWidth || 1.5;
        $.jqplot.LineRenderer.prototype.init.call(this, options);
        this._type = 'errorbar';
        var dbx = this._xaxis._dataBounds;
        var dby = this._yaxis._dataBounds;
        var d = this._plotData;

        if (this.renderer.errorBar) {
            this._xaxis.resetDataBounds = newResetDataBounds;
            this._yaxis.resetDataBounds = newResetDataBounds;

            this._xaxis.resetDataBounds();
            this._yaxis.resetDataBounds();

        }

    };

    // called within scope of series.
    $.jqplot.errorbarRenderer.prototype.draw = function(ctx, gd, options) {
        $.jqplot.LineRenderer.prototype.draw.call(this, ctx, gd, options);
        if (this.renderer.errorBar === true) {
            var d = this.data;
            var xmin = this._xaxis.min;
            var xmax = this._xaxis.max;
            // index of last value below range of plot.
            var xminidx = 0;
            // index of first value above range of plot.
            var xmaxidx = d.length;
            var xp = this._xaxis.series_u2p;
            var yp = this._yaxis.series_u2p;
            var i, prevColor, ops, b, h, w, a, points;
            var r = this.renderer;
            var opts = (options !== undefined) ? options : {};
            var shadow = (opts.shadow !== undefined) ? opts.shadow : this.shadow;
            var fill = (opts.fill !== undefined) ? opts.fill : this.fill;
            var fillAndStroke = (opts.fillAndStroke !== undefined) ? opts.fillAndStroke : this.fillAndStroke;
            r.bodyWidth = (opts.bodyWidth !== undefined) ? opts.bodyWidth : r.bodyWidth;
            r.tickLength = (opts.tickLength !== undefined) ? opts.tickLength : r.tickLength;
            ctx.save();
            if (this.show) {
                var x, y, xu, xl, yu, yl;
                // need to get widths based on number of points shown,
                // not on total number of points.  Use the results
                // to speed up drawing in next step.
                for (i = 0; i < d.length; i++) {
                    if (d[i][0] < xmin) {
                        xminidx = i;
                    } else if (d[i][0] < xmax) {
                        xmaxidx = i + 1;
                    }
                }

                var dwidth = this.gridData[xmaxidx - 1][0] - this.gridData[xminidx][0];
                var nvisiblePoints = xmaxidx - xminidx;
                var dinterval;
                try {
                    dinterval = Math.abs(this._xaxis.series_u2p(parseInt(this._xaxis._intervalStats[0].sortedIntervals[0].interval)) - this._xaxis.series_u2p(0));
                } catch (e) {
                    dinterval = dwidth / nvisiblePoints;
                }

                if (typeof(r.tickLength) == 'number') {
                    r._tickLength = r.tickLength;
                } else {
                    r._tickLength = Math.min(10, dinterval / 3.5);
                }

                for (i = xminidx; i < xmaxidx; i++) {
                    x = xp(d[i][0]);
                    y = yp(d[i][1]);

                    xu = xp(d[i][2].xupper);
                    xl = xp(d[i][2].xlower);
                    yu = yp(d[i][2].yupper);
                    yl = yp(d[i][2].ylower);

                    prevColor = opts.color;

                    // draw bar
                    if (r.barColor) {
                        opts.color = r.barColor;
                    }
                    // draw vertical line from upper to lower bound
                    r.shapeRenderer.draw(ctx, [
                        [x, yu],
                        [x, yl]
                    ], opts);
                    // draw horizontal line from upper to lower bound
                    r.shapeRenderer.draw(ctx, [
                        [xu, y],
                        [xl, y]
                    ], opts);

                    // draw max
                    opts.color = prevColor;
                    if (r.maxColor) {
                        opts.color = r.maxColor;
                    }
                    if (yu !== null) {
                        // draw upper bound horizontal line
                        r.shapeRenderer.draw(ctx, [
                            [x + r._tickLength / 2, yu],
                            [x - r._tickLength / 2, yu]
                        ], opts);
                    }
                    if (xu !== null) {
                        // draw upper bound vertical line
                        r.shapeRenderer.draw(ctx, [
                            [xu, y + r._tickLength / 2],
                            [xu, y - r._tickLength / 2]
                        ], opts);
                    }

                    // draw min
                    opts.color = prevColor;
                    if (r.minColor) {
                        opts.color = r.minColor;
                    }
                    if (yl !== null) {
                        // draw lower bound horizontal line
                        r.shapeRenderer.draw(ctx, [
                            [x + r._tickLength / 2, yl],
                            [x - r._tickLength / 2, yl]
                        ], opts);
                    }
                    if (xl !== null) {
                        // draw lower bound vertical line
                        r.shapeRenderer.draw(ctx, [
                            [xl, y + r._tickLength / 2],
                            [xl, y - r._tickLength / 2]
                        ], opts);
                    }

                    // Draw mean
                    if (r.mean) {
                        opts.color = prevColor;
                        if (r.meanColor) {
                            opts.fillStyle = r.meanColor;
                        }
                        // draw the mean
                        console.log(opts.color);
                        opts.fillRect = true;
                        r.shapeRenderer.draw(
                            ctx, [Math.round((xu + xl) / 2 - (r._tickLength / 4)),
                                Math.round((yu + yl) / 2 - (r._tickLength / 4)),
                                r._tickLength / 2,
                                r._tickLength / 2
                            ],
                            opts);
                        opts.fillRect = false;
                    }

                    opts.color = prevColor;
                }
            }

            ctx.restore();
        }
    };

    $.jqplot.errorbarRenderer.prototype.drawShadow = function(ctx, gd, options) {
        // This is a no-op, shadows drawn with lines.
    };

    // called with scope of plot.
    $.jqplot.errorbarRenderer.checkOptions = function(target, data, options) {
        // provide some sensible highlighter options by default
        // These aren't good for hlc, only for errorbar or candlestick
        if (!options.highlighter) {
            options.highlighter = {
                showMarker: false,
                tooltipAxes: 'y',
                yvalues: 4,
                formatString: '<table class="jqplot-highlighter"><tr><td>date:</td><td>%s</td></tr><tr><td>max:</td><td>%s</td></tr><tr><td>hi:</td><td>%s</td></tr><tr><td>low:</td><td>%s</td></tr><tr><td>min:</td><td>%s</td></tr></table>'
            };
        }
    };

    function newResetDataBounds() {
        // overriding for the axes
        var db = this._dataBounds;
        db.min = null;
        db.max = null;
        var xlower, xupper, ylower, yupper;
        for (var i = 0; i < this._series.length; i++) {
            var s = this._series[i];
            var d = s._plotData;
            if (s.renderer.errorBar) {
                // Loop through all points
                for (var j = 0; j < d.length; j++) {
                    // First set xupper, xlower, yupper, ylower
                    // Then adjust axis ranges if necessary

                    var eb = d[j][2];
                    if (eb === null) {
                        return;
                    }

                    if (this.name == 'xaxis' || this.name == 'x2axis') {
                        if (eb.xerr) {
                            // If symmetric
                            if (isNumeric(eb.xerr)) {
                                eb.xerr = [eb.xerr, eb.xerr];
                            }
                            if (jQuery.isArray(eb.xerr)) {
                                eb.xlower = d[j][0] - eb.xerr[0];
                                eb.xupper = d[j][0] + eb.xerr[1];
                            }
                        }
                        if (eb.xlower < db.min || db.min === null) {
                            db.min = eb.xlower;
                        }
                        if (eb.xupper > db.max || db.max === null) {
                            db.max = eb.xupper;
                        }
                    } else { // it's a y-axis
                        if (eb.yerr) {
                            // If symmetric
                            if (isNumeric(eb.yerr)) {
                                eb.yerr = [eb.yerr, eb.yerr];
                            }
                            if (jQuery.isArray(eb.yerr)) {
                                eb.ylower = d[j][1] - eb.yerr[0];
                                eb.yupper = d[j][1] + eb.yerr[1];
                            }
                        }
                        if (eb.ylower < db.min || db.min === null) {
                            db.min = eb.ylower;
                        }
                        if (eb.yupper > db.max || db.max === null) {
                            db.max = eb.yupper;
                        }
                    }
                }
            }
        }
    }

    //$.jqplot.preInitHooks.push($.jqplot.errorbarRenderer.checkOptions);
    //$.jqplot.postInitHooks.push($.jqplot.errorbarRenderer.alterResetScale);

})(jQuery);

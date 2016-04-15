  var data =
      [{
          name: "Test",
          points: [
              [2, 2],
              [4, 3],
              [6, 5],
              [9, 7]
          ],
          yerr: [
              [2, null],
              [1, 2],
              [1, 2],
              [1, 2]
          ],
          xerr: [
              [1, 1],
              [null, 1],
              [0, 0],
              1
          ]

      }];

  function renderData(data) {
      var series = [];
      var options1 = {
          title: 'Error Bars',
          series: [],
          axes: {}
      };
      var options2 = {
          title: 'Candlestick Error Bars',
          series: [],
          axes: {}
      };

      for (index in data) {

          s_ = [];
          for (i in data[index].points) {
              s_.push([data[index].points[i][0], data[index].points[i][1], {
                  xerr: data[index].xerr[i],
                  yerr: data[index].yerr[i]
              }]);
              //s_.push([Math.pow(10,data[index].points[i][0]), Math.pow(10, data[index].points[i][1]), { xerr: [-Math.pow(10,data[index].points[i][0]-data[index].xerr[i][0])+Math.pow(10, data[index].points[i][0]),Math.pow(10, data[index].points[i][0]+data[index].xerr[i][1])-Math.pow(10,data[index].points[i][0])], yerr:  [-Math.pow(10,data[index].points[i][1]-data[index].yerr[i][0])+Math.pow(10, data[index].points[i][1]),Math.pow(10, data[index].points[i][1]+data[index].yerr[i][1])-Math.pow(10,data[index].points[i][1])] }]);
          }
          series.push(s_);

          //options.axes = { xaxis: { renderer: $.jqplot.LogAxisRenderer, tickDistribution: 'power', tickOptions: { formatString: '%.0e' } } , yaxis: { renderer: $.jqplot.LogAxisRenderer, tickDistribution: 'power', tickOptions: { formatString: '%.0e' } }};
          options1.series.push({
              renderer: $.jqplot.errorbarRenderer,
              rendererOptions: {
                  tickLength: 20,
                  barColor: 'red',
                  minColor: 'blue',
                  maxColor: 'green',
                  meanColor: 'red',
              }
          });

          options2.series.push({
              renderer: $.jqplot.errorbarRenderer,
              rendererOptions: {
                  meanColor: 'red',
              }
          });
      }

      //  console.log(series);
      //  console.log(options);
      var plot1 = $.jqplot('chart1', series, options1);
      var plot2 = $.jqplot('chart2', series, options2);

  }

  $(document).ready(function() {
      $.jqplot.config.enablePlugins = true;
      renderData(data);
  });

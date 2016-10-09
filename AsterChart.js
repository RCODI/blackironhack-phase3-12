
function makeChartData() {

  var data = [];
    if (price_value != null) {
      var price_value_inverse = 1 - price_value;
      data.push({"id": "Pri", "order": 1, "score": price_value_inverse, "weight": 1, "color": "#E1514B", "label": "Price"});
    }
    if (rating_value != null) {
      data.push({"id": "Rat", "order": 1, "score": rating_value, "weight": 1, "color": "#FEC574", "label": "Rating"});
    }
    if (service_value != null) {
      data.push({"id": "Ser", "order": 1, "score": service_value, "weight": 1, "color": "#FAE38C", "label": "Service"});
    }
    if (final_freshness != null) {
      freshness_value = 0.2 * rating_value + 0.2 * openhour_value + 0.6 * final_freshness;
      data.push({"id": "Fre", "order": 1, "score": freshness_value, "weight": 1, "color": "#C7E89E", "label": "Freshness"});
    }
    if (openhour_value != null) {
      data.push({"id": "OpH", "order": 1, "score": openhour_value, "weight": 1, "color": "#4D9DB4", "label": "Open Hour"});
    } 
    if (distance_value != null) {
      distance_value = 1 - distance_value;
      data.push({"id": "Dis", "order": 1, "score": distance_value, "weight": 1, "color": "#5E4EA1", "label": "Distance"});
    }
    return data;
}


function AsterChart(data) {
  var chart_id = "#aster-chart";

  var width = 300,
      height = 300,
      radius = Math.min(width, height) / 2,
      innerRadius = 0.25 * radius,
      levels = 4;

  var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.width; });

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0, 0])
    .html(function(d) {
      return d.data.label + ": <span style='color:orangered'>" + Math.round(d.data.score * 100) 
      						+ "pt" + "</span>";
    });

  var arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(function (d) { 
      return (radius - innerRadius) * (d.data.score) + innerRadius;
    });

  var outlineArc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(radius);

  d3.select(chart_id).select("svg").remove();

  var svgout = d3.select(chart_id).append("svg")
    .attr("width", width + 180)
    .attr("height", height);

  var svg = svgout
    .append("g")
    .attr("transform", "translate(" + radius + "," + height / 2 + ")");

  var filter = svgout.append('defs').append('filter').attr('id','glow'),
	feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
	feMerge = filter.append('feMerge'),
	feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
	feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');

  svg.call(tip);

  data.forEach(function(d) {
    d.id     =  d.id;
    d.order  = +d.order;
    d.color  =  d.color;
    d.weight = +d.weight;
    d.score  = +d.score;
    d.width  = +d.weight;
    d.label  =  d.label;
  });
    
	//Wrapper for the grid & axes
  var axisGrid = svg.append("g").attr("class", "axisWrapper");

	//Draw the background circles
  axisGrid.selectAll(".levels")
      .data(d3.range(1,(levels+1)).reverse())
    .enter()
	  .append("circle")
	  .attr("class", "gridCircle")
	  .attr("r", function(d, i){return radius/levels*d;})
	  .style("fill", "#CDCDCD")
	  .style("stroke", "#CDCDCD")
	  .style("fill-opacity", 0.1)
	  .style("filter" , "url(#glow)");

  var outerPath = svg.selectAll(".outlineArc")
      .data(pie(data))
    .enter().append("path")
      .attr("fill", "#CDCDCD")
      .attr("stroke", "none")
      .attr("class", "outlineArc")
      .style("fill-opacity", 0.1)
      .style("filter" , "url(#glow)")
      .attr("d", outlineArc);  

  var path = svg.selectAll(".solidArc")
      .data(pie(data))
    .enter().append("path")
      .attr("fill", function(d) { return d.data.color; })
      .attr("class", "solidArc")
      .attr("stroke", "none")
      .style("fill-opacity", 0.95)
      .style("filter" , "url(#glow)")
      .attr("d", arc)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);


  // calculate the weighted mean score
  var score = 
    data.reduce(function(a, b) {
//      console.log('a:' + a + ', b.score: ' + b.score + ', b.weight: ' + b.weight);
      return a + (b.score * b.weight); 
    }, 0) / 
    data.reduce(function(a, b) { 
      return a + b.weight; 
    }, 0);


  svg.append("svg:text")
    .attr("class", "aster-score")
    .attr("text-anchor", "middle") // text-align: right
    .text("Overall");

  svg.append("svg:text")
    .attr("class", "aster-score")
    .attr("dy", "1em")
    .attr("text-anchor", "middle") // text-align: right
    .text(Math.round(score * 100) + "pt");


  var range = [];
  var domain = [];
    for (var i = 0; i < data.length; i++) {
      var color_i = data[i].color;
      range.push(color_i);
      var score_i = Math.round(data[i].score * 100);
      var label_i = data[i].label;
      var text_i = label_i + ": " + score_i + "pt";
      domain.push(text_i);
    }

  var fill = d3.scale.ordinal()
      .domain(domain)
      .range(range);

  var legend = svgout.selectAll(".legend")
      .data(fill.domain())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(" + (width - 20) + "," + i * 20 + ")"; });

      // draw legend colored rectangles
      legend.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("x", 40)
      .attr("y", 160)
      .style("filter" , "url(#glow)")
      .style("fill", function(d) { return fill(d); });

      // draw legend text
      legend.append("text")
      .attr("y", 169)
      .attr("dx", 72)
      .attr("dy", ".35em")
      .style("text-anchor", "left")
      .text(function(d) { return d;})

  function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }

}

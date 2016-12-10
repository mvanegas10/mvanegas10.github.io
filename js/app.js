var width = 980,
    height = 650,
    padding = 1.5, // separation between same-color nodes
    clusterPadding = 16, // separation between different-color nodes
    maxRadius = 12;    

var n = 200, // total number of nodes
    m = 3; // number of distinct clusters

var color = d3.scale.category10()
    .range(["#cc9a45",
"#8f62ca",
"#5cb751",
"#c75d9c",
"#a6b345",
"#6b8bcd",
"#be6634",
"#4eb598",
"#ce5458",
"#637b38"])
    .domain([0,1,2,3,4,5,6,7,8,9]);

// The largest node for each cluster.
var clusters = new Array(m);


var repos = [];
var languages = {};
$.get('https://api.github.com/users/mvanegas10/repos', function(responseText) {
    repos = responseText;

    var lan = repos.map(function(d) {return d.language;})
    for (var i = 0; i < lan.length; i++) {
    	if (languages[lan[i]] === undefined)  {
    		languages[lan[i]] = i;
    	}
	};
	createForceChart(createNodes(repos));
});

function createForceChart(nodes) {
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return "<span>" + d.text + "</span>";
    })

  var force = d3.layout.force()
      .nodes(nodes)
      .size([width, height])
      .gravity(.02)
      .charge(0)
      .on("tick", tick)
      .start();

  var svg = d3.select("#forceChart").append("svg")
      .attr("width", width)
      .attr("height", height);

  var node = svg.selectAll("circle")
      .data(nodes)
    .enter().append("circle")
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .style("fill", function(d) { return color(d.cluster); })      
      .call(force.drag);

  node.transition()
      .duration(750)
      .delay(function(d, i) { return i * 5; })
      .attrTween("r", function(d) {
        var i = d3.interpolate(0, d.radius);
        return function(t) { return d.radius = i(t); };
      });
  function tick(e) {
    node
        .each(cluster(10 * e.alpha * e.alpha))
        .each(collide(.5))
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }

  // Move d to be adjacent to the cluster node.
  function cluster(alpha) {
    return function(d) {
      var cluster = clusters[d.cluster];
      if (cluster === d) return;
      var x = d.x - cluster.x,
          y = d.y - cluster.y,
          l = Math.sqrt(x * x + y * y),
          r = d.radius + cluster.radius;
      if (l != r) {
        l = (l - r) / l * alpha;
        d.x -= x *= l;
        d.y -= y *= l;
        cluster.x += x;
        cluster.y += y;
      }
    };
  }

  // Resolves collisions between d and all other circles.
  function collide(alpha) {
    var quadtree = d3.geom.quadtree(nodes);
    return function(d) {
      var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
          nx1 = d.x - r,
          nx2 = d.x + r,
          ny1 = d.y - r,
          ny2 = d.y + r;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  }
  svg.call(tip);
}

function createNodes(data) {
  var nodes = [];
  data.forEach(function(dat) {
  	console.log(languages);
    var i = languages[dat.language],
      r = 50,
      d = {
        text: dat.name,
        cluster: i,
        radius: r,
        x: Math.cos(i / m * 2 * Math.PI) * 200 + width / 2 + Math.random(),
        y: Math.sin(i / m * 2 * Math.PI) * 200 + height / 2 + Math.random()
      };
    if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
    nodes.push(d);
  });
  d3.select("#forceChart").html("");
  d3.select("#forceChart").selectAll("*").remove();  
  return nodes;
} 
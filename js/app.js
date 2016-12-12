var width = 980,
    height = 500,
    padding = 1.5, // separation between same-color nodes
    clusterPadding = 16, // separation between different-color nodes
    maxRadius = 70;    

var n = 200, // total number of nodes
    m = 8; // number of distinct clusters

var dr = d3.scale.linear();

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

var proj = [
  {
    "name": "Muequeta",
    "contributions": 43,
    "language": "Swift",
    "svn_url": "https://github.com/mvanegas10/Muequeta"
  },
  {
    "name": "Caso2",
    "contributions": 43,
    "language": "Swift",
    "svn_url": "https://github.com/mvanegas10/Muequeta"
  },  
  {
    "name": "javeandes-hackathon",
    "contributions": 28,
    "language": "JavaScript",
    "svn_url": "https://github.com/mvanegas10/Muequeta"
  }, 
  {
    "name": "ErosionIdentificationFromLandsatImages",
    "contributions": 11,
    "language": "Python",
    "svn_url": "https://github.com/mvanegas10/ErosionIdentificationFromLandsatImages"
  },    
]
var clusters;
var repos = [];
var languages = {};
var cantRepos = 0;

$.ajax({
    type: 'GET',
    url: 'https://api.github.com/users/mvanegas10/repos',
    dataType: 'json',
    success: function (data) {
      cantRepos = data.length;
      var i = 1;      
      data.forEach(function (repo) {
        var contributions = undefined;
        console.log(repo.language)
        if (repo.language) {
          if (languages[repo.language] === undefined)  {
            languages[repo.language] = i;
            i++;
          }
          var project = {"name" : repo.name, "svn_url": repo.svn_url, "language": repo.language};
          repos.push(project); 
        }        
    });
    clusters = new Array(Object.keys(languages).length); 
    createForceChart(createNodes(repos));        
  }
});


function createForceChart(nodes) {
	var tip = d3.tip()
		.attr('class', 'd3-tip')
		.offset([30, 0])
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
	  .on('click', function (d) {
		  var win = window.open(d.url, '_blank');
		  win.focus();

	  	console.log(d.url)})	  
	  .style("fill", function(d) { return color(d.cluster); })      
	  .call(force.drag);
	    
	node.transition()
	  .duration(750)
	  .delay(function(d, i) { return 5+ i *10; })
	  .attrTween("r", function(d) {
	    var i = d3.interpolate(0, d.radius);
	    return function(t) { return d.radius = i(t); };
	  });
	function tick(e) {
	node
	    .each(cluster(10 * e.alpha * e.alpha))
	    .each(collide(.5))
	    .attr("cx", function(d) { return d.x; })
	    .attr("cy", function(d) { return d.y; })   
	}

	var svg2 = d3.select("#legend").append("svg")
    .attr("width", width)
    .attr("height", 50);

	svg2.selectAll("rect")
	  .data(Object.keys(languages))
	.enter().append("rect")
    .on('mouseover', function(d) {callFromLanguage(d);})
	  .attr("x",function(d, i) {return i*140 + 25})
	  .attr("y",10)
	  .attr("width",20)
	  .attr("height", 20)
	  .style("fill", function(d,i) { return color(i+1); })

  svg2.selectAll("text")
    .data(Object.keys(languages))
  .enter().append("text")
    .attr("x",function(d, i) {return i*140 + 50})
    .attr("y",25)
    .attr("width",20)
    .attr("height", 20)
    .text(function(d,i) { return d; })          

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

function callFromLanguage (lan) {
  console.log(lan);
}

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
}

function createNodes(data) {
  dr.range([0,maxRadius]);
  dr.domain([0, d3.max(data, function(d) {return d.contributions;})])
  var nodes = [];
  data.forEach(function(dat) {
    console.log(languages[dat.language]);
    console.log(dat.language);
    console.log(Math.cos(0 / languages[dat.language] * 2 * Math.PI) * 200 + width / 2 + Math.random());
    var i = languages[dat.language],
      r = (dat.contributions === undefined)? 30: dr(dat.contributions),
      d = {
        x: Math.cos(i / m * 2 * Math.PI) * 200 + width / 2 + Math.random(),
        y: Math.sin(i / m * 2 * Math.PI) * 200 + height / 2 + Math.random(), 
        radius: r,
        cluster: i,        
        url: dat.svn_url,
        text: dat.name,
        contributions:dat.contributions
      };
    if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
    nodes.push(d);
  });
  d3.select("#forceChart").html("");
  d3.select("#forceChart").selectAll("*").remove();  
  d3.select("#legend").html("");
  d3.select("#legend").selectAll("*").remove();  
  console.log(nodes);  
  return nodes;
} 
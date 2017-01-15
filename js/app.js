var width = 980,
    height = 500,
    padding = 1.5, // separation between same-color nodes
    clusterPadding = 16, // separation between different-color nodes
    maxRadius = 117;    

var n = 200, // total number of nodes
    m = 8; // number of distinct clusters

var dr = d3.scale.linear();

var color = d3.scale.category10()
    .range(["#daa4ff","#74bd5b","#ec8fb4","#ff9f8a","#fbb153","#02d1e5","#91ffaa","#8bebe5","#4cbea8","#d5ffaa"])
    .domain([0,1,2,3,4,5,6,7,8,9]);

var clusters;
var repos = [];
var languages = {};
var cantRepos = 0;

var reposStatic = {"SisTrans":{"contributions":117},"Caso2":{"contributions":9},"kobdig-master":{"contributions":7},"kobdig-validation":{"contributions":3},"DALGO":{"contributions":5},"HCLimei":{"contributions":17},"InfracompCaso2":{"contributions":1},"javeandes-hackathon":{"contributions":28},"TOMSA":{"contributions":10},"VA201620-Project09":{"contributions":84},"DesarrolloSw":{"contributions":0},"VisualT4":{"contributions":7},"mvanegas10.github.io":{"contributions":28},"World-s-Biggest-Data-Breaches":{"contributions":15},"HCLimei_Desktop":{"contributions":32},"DataEncryption":{"contributions":4},"ErosionIdentificationFromLandsatImages":{"contributions":11},"PacmanProjects":{"contributions":5},"Muequeta-Backend":{"contributions":11},"Muequeta":{"contributions":43},"Plebiscito-Colombia-2016":{"contributions":51},"rbsas":{"contributions":23},"TallerRestAngular":{"contributions":0}}

$.ajax({
    type: 'GET',
    url: 'https://api.github.com/users/mvanegas10/repos',
    dataType: 'json',
    success: function (data) {
      cantRepos = data.length;
      var i = 1;      
      data.forEach(function (repo) {
        var contributions = undefined;
        if (repo.language) {
          if (languages[repo.language] === undefined)  {
            languages[repo.language] = i;
            i++;
          }
          var project = {"name" : repo.name, "svn_url": repo.svn_url, "language": repo.language, "description": repo.description};
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

  var selected = false;

	var node = svg.selectAll("g")
    .data(nodes);
    
  var nodeEnter = node.enter().append("g")
    .on('mouseover', function (d) {
      setDescription(d);
      tip.show;
    })
    .on('mouseout', tip.hide)    
    .style("text-anchor", "middle")
    .call(force.drag);

  var circles = nodeEnter.append("circle")
    .attr("r", function (d) {return d.radius;})
	  .style("fill", function(d) { return color(d.cluster); })
    .on('click', function (d) {
      selected = false;
      setDescription(d);
      selected = true;
      d3.selectAll("circle")[0].forEach(function (circle) {
          d3.select(circle).style("fill", function(i){return color(i.cluster)
        });
      });
      d3.select(this).style("fill", d3.rgb(color(d.cluster)).darker());
    });   
	    
	node.transition()
	  .duration(750)
	  .delay(function(d, i) { return 5+ i *10; })
	  .attrTween("r", function(d) {
	    var i = d3.interpolate(0, d.radius);
	    return function(t) { return d.radius = i(t); };
	  });

  var labels = nodeEnter.append("text")
    .html(function(d) {
      if (reposStatic[d.text] && reposStatic[d.text].contributions >= 32) {  
        if(d.text.indexOf("-") !== -1){
          var html = d.text.split("-");
          return html.join(" ");
        }          
        else if(d.text.indexOf("_") !== -1){
          var html = d.text.split("_");
          return html.join(" ");
        } 
        else if(d.text.indexOf(".") !== -1){
          var html = d.text.split(".");
          return html[0];
        } 
        else return d.text;
      }
      return "";
    }); 


	function tick(e) {
	node
	    .each(cluster(10 * e.alpha * e.alpha))
	    .each(collide(.5))
      .attr("transform",function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      })
	}

	var svg2 = d3.select("#legend").append("svg")
    .attr("width", 980)
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

  function setDescription(data) {
    if (!selected) {
      d3.select("#projectName").text(data.text);
      d3.select("#projectURL")
        .text("Explore")
        .attr("xlink:href", data.url)
        .on("click", function() { window.open(data.url);});    
      d3.select("#projectDescription").text(data.description);
    }
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
  var arrDat = [];
  dr.domain([0, 117])
  var nodes = [];
  data.forEach(function(dat) {
    var i = languages[dat.language],
      r = (!reposStatic[dat.name])? dr(10): dr(reposStatic[dat.name].contributions),
      d = {
        x: Math.cos(i / m * 2 * Math.PI) * 200 + width / 2 + Math.random(),
        y: Math.sin(i / m * 2 * Math.PI) * 200 + height / 2 + Math.random(), 
        radius: r,
        cluster: i,        
        url: dat.svn_url,
        text: dat.name,
        description: dat.description,
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
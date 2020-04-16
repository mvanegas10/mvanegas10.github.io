var width = document.getElementById('forceChart').parentElement.clientWidth,
	height = 500,
	padding = 1.5, // separation between same-color nodes
	clusterPadding = 16, // separation between different-color nodes
	maxRadius = 70,
	x,
	reposStatic = {}

var n = 35, // total number of nodes
	m = 11; // number of distinct clusters

var dr = d3.scale.linear();

var color = d3.scale.category10()
	.range(['#CFAD75', '#A5A78C', '#A17E87', '#A15F49', '#000023', '#AA9A94', '#D1AEA3', '#A36956', '#A58B82', '#BA9E94'])
	.domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

var clusters;
var repos = [];
var languages = {};
var cantRepos = 0;

d3.json('./docs/repos.json', function (data) {
	data.forEach(function (d) {
		if (!reposStatic[d.name]) {
			reposStatic[d.name] = { 'contributions': 20 };
		}
	});
})

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
				if (languages[repo.language] === undefined) {
					languages[repo.language] = i;
					i++;
				}
				var project = {
					'name': repo.name, 'svn_url': repo.svn_url, 'language': repo.language, 'description': repo.description, 'homepage': repo.homepage,
					'date': new Date(repo['pushed_at'])
				}
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
		.offset([2000, 25000])
		.html(function (d) {
			return '<span>' + d.text + '</span>';
		})

	var force = d3.layout.force()
		.nodes(nodes)
		.size([width, height])
		.gravity(0.05)
		.charge(10)
		.on('tick', tick)
		.start();

	var svg = d3.select('#forceChart').append('svg')
		.attr('width', width)
		.attr('height', height);

	var selected = false;

	var node = svg.selectAll('g')
		.data(nodes);


	var nodeEnter = node.enter().append('g')
		.on('mouseover', function (d) {
			setDescription(d);
			tip.show;
		})
		.on('mouseout', tip.hide)
		.style('text-anchor', 'middle')
		.call(force.drag);

	var circles = nodeEnter.append('circle')
		.attr('r', function (d) {
			return d.radius;
		})
		.style('fill', function (d) { return color(d.cluster); })
		.style('fill-opacity', 0.5)
		.on('click', function (d) {
			selected = false;
			setDescription(d);
			selected = true;
			d3.selectAll('circle')[0].forEach(function (circle) {
				d3.select(circle).style('fill', function (i) {
					return color(i.cluster)
				})
					.style('stroke', function (i) {
						return d3.rgb(color(i.cluster)).darker()
					})
					.style('stroke-width', '5')
			});
			d3.select(this).style('fill', d3.rgb(color(d.cluster)).darker()).style('stroke', 'none');
		});

	let tmp = nodes.sort((a, b) => a.radius - b.radius)
	setDescription(tmp[tmp.length - 1]);

	node.transition()
		.duration(750)
		.delay(function (d, i) { return 5 + i * 10; })
		.attrTween('r', function (d) {
			var i = d3.interpolate(0, d.radius);
			return function (t) { return d.radius = i(t); };
		});

	var labels = nodeEnter.append('text')
		.text(function (d) {
			return d.radius >= 25 ? d.text : ''
		});


	function tick(e) {
		node
			.each(cluster(10 * e.alpha * e.alpha))
			.each(collide(.5))
			.attr('transform', function (d) {
				return 'translate(' + d.x + ',' + (d.y - 50) + ')';
			})
	}

	var svg2 = d3.select('#legend').append('svg')
		.attr('width', width)
		.attr('height', 100);

	var legendG = svg2.selectAll('g')
		.data(Object.keys(languages))

	var legendGEnter = legendG.enter().append('g');

	var rects = legendGEnter.append('rect')
		.on('mouseover', function (d) { callFromLanguage(d); })
		.attr('x', function (d, i) {
			if (i < 7) return i * 140 + 25;
			else return (i - 7) * 140 + 25;
		})
		.attr('y', function (d, i) {
			if (i < 7) return 10;
			else return 60;
		})
		.attr('width', 20)
		.attr('height', 20)
		.style('fill', function (d, i) { return color(i + 1); })
		.style('fill-opacity', 0.5)

	legendGEnter.append('text')
		.attr('x', function (d, i) {
			if (i < 7) return i * 140 + 50;
			else return (i - 7) * 140 + 50;
		})
		.attr('y', function (d, i) {
			if (i < 7) return 25;
			else return 75;
		})
		.attr('width', 20)
		.attr('height', 20)
		.text(function (d, i) { return d; })

	// Move d to be adjacent to the cluster node.
	function cluster(alpha) {
		return function (d) {
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
		if (!selected) {
			d3.select('#projectName').text(data.text);
			d3.select('#projectURL')
				.text('Explore')
				.attr('xlink:href', data.url)
				.on('click', function () { window.open(data.url); });
			d3.select('#projectDescription').text(data.description);
			if (data.homepage) {
				d3.select('#homepage')
					.text(data.homepage)
					.attr('xlink:href', data.homepage)
					.on('click', function () { window.open(data.homepage); });
			}
			else d3.select('#homepage').html('')
				.text('')
		}
	}

	// Resolves collisions between d and all other circles.
	function collide(alpha) {
		var quadtree = d3.geom.quadtree(nodes);
		return function (d) {
			var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
				nx1 = d.x - r,
				nx2 = d.x + r,
				ny1 = d.y - r,
				ny2 = d.y + r;
			quadtree.visit(function (quad, x1, y1, x2, y2) {
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

	function callFromLanguage(lan) {
		var groupsForce = svg.selectAll('circle');

	}
}

function make_base_auth(user, password) {
	var tok = user + ':' + password;
	var hash = btoa(tok);
	return 'Basic ' + hash;
}

function createNodes(data) {
	dr.range([0, maxRadius]);
	x = d3.time.scale()
		.range([0, maxRadius])
		.domain(d3.extent(data, d => d.date))
	var arrDat = [];
	dr.domain([0, 117])
	var nodes = [];
	data.forEach(function (dat) {
		var i = languages[dat.language],
			r = (!dat.date) ? dr(10) : x(dat.date),
			d = {
				x: Math.cos(i / m * 2 * Math.PI) * 200 + width / 2 + Math.random(),
				y: Math.sin(i / m * 2 * Math.PI) * 200 + Math.random(),
				radius: r,
				cluster: i,
				url: dat.svn_url,
				text: dat.name,
				description: dat.description,
				contributions: dat.contributions,
				homepage: dat.homepage
			};
		if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
		nodes.push(d);
	});
	d3.select('#forceChart').html('');
	d3.select('#forceChart').selectAll('*').remove();
	d3.select('#legend').html('');
	d3.select('#legend').selectAll('*').remove();
	return nodes;
} 
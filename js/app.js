var repos = [];
$.get('https://api.github.com/users/mvanegas10/repos', function(responseText) {
    repos = responseText;

    repos.forEach(function (d) {
		console.log(d.name);
	});

});


var fs = require('fs');

module.exports = function()
{
	var me = this,
    classes = {};
  fs.readdirSync(__dirname).forEach(function(file)
	{
      if(file == "index.js") return;
      var name = file.substr(0, file.indexOf('.'));
      try
      {
				var classDat = require('./' + name);
				var obj = classDat.prototype;
				var methods = [];
				do
				{
						methods = methods.concat(Object.getOwnPropertyNames(obj));
				}
				while(obj = Object.getPrototypeOf(obj));

				var methodsOut = {};
				for(var i=0;i<methods.length;i++)
				{
					var method = methods[i];
					methodsOut[method.toLowerCase()] = method;
				}

				classes[name.toLowerCase()] = {
					origName: name,
					class: classDat,
					methods: methodsOut
				};
      }
      catch (e)
      {
				//console.log(name)
        //throw(e);
      }
  });
  return classes;
}

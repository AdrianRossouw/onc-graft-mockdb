// A quick test implementation to get something happening on the screen.
// a simple in-memory data adapter for tests.
var ns = new (require('Nonsense'))();

this.testData = {};

this.findModel = function(model, id) {
    var dfr = new _.Deferred();

    if (!this.testData[model] || !id) {
        dfr.reject(405, 'no model or id');
    } else {
        var result = _(this.testData[model]).findWhere({id:id});
        result ? dfr.resolve(result) : dfr.reject(404);
    }

    return dfr.promise();
};

_.extend(this, {
    readModel: function readModel(name, model, id) {
        debug('readModel :', name, id);
        return this.findModel(name, id); 
    },
    updateModel: function readModel(name, model, id, data) {
        debug('updateModel :', name, id);
        var dfr = new _.Deferred();

        var data = _.clone(data);

        function updateModel(m) {
            _.extend(m, data);
            dfr.resolve(m);
        }
        this.findModel(name, id).then(updateModel, dfr.reject);

        return dfr.promise();
    },
    createModel: function(name, model, data) {
        debug('createModel :', name, data);
        var dfr = new _.Deferred();

        var data = _.clone(data);

        function modelExists(model) {
            dfr.reject(409, 'Conflict');
        }

        // we dont want the model to exist
        function createModel(err, reason) {
            _.extend(data, { id: ns.uuid() });
            this.testData[name].push(data);
            dfr.resolve(data);
        }

        this.findModel(name, data.id).then(modelExists, _.bind(createModel, this));

        return dfr.promise();
    },
    deleteModel: function(name, model, id) {
        var dfr = new _.Deferred();

        function deleteModel(m) {
            var ind = _(this.testData[name]).indexOf(m);
            this.testData[name].splice(ind, 1);

            dfr.resolve(204);
        }

        this.findModel(name, id).then(_.bind(deleteModel, this), dfr.reject);
        return dfr.promise();
    },
    readCollection: function readModel(name, col) {
        debug('read collection ' + name);
        var dfr = new _.Deferred();
        this.testData[name] ? dfr.resolve(this.testData[name]) : dfr.reject(404);
        return dfr.promise();
    },
    setupData: function() {
        Graft.Data.reqres.setHandler('read', this.readModel, this);
        Graft.Data.reqres.setHandler('update', this.updateModel, this);
        Graft.Data.reqres.setHandler('create', this.createModel, this);
        Graft.Data.reqres.setHandler('delete', this.deleteModel, this);
        Graft.Data.reqres.setHandler('query', this.readCollection, this);
    }
});

this.addInitializer(function(opts) {
    debug("adding handler for reading models");
    Graft.Data.commands.setHandler('setup', this.setupData, this);
});

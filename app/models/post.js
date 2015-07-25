var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var PostSchema = new Schema({

    creator: { type: Schema.Types.ObjectId, ref: 'User'},
    content: String,
    created: { type: Date, defauly: Date.now}
});

module.exports = mongoose.model('Story', PostSchema);

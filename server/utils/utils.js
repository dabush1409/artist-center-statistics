// module.exports = {
//     object: require('./objectUtils'),
//     array: require('./arrayUtils'),
//     date: require('./dateUtils'),
//     util: require('util'),
//
//     youtubeDurationToSeconds: function (ytDurationStr) {
//         var hours, minutes, seconds;
//         try {
//             var durationPattern = new RegExp(/([0-9]+H)?([0-9]+M)?([0-9]+)S/);
//             hours = ytDurationStr.match(durationPattern)[1];
//             minutes = ytDurationStr.match(durationPattern)[2];
//             seconds = ytDurationStr.match(durationPattern)[3];
//         }
//         catch (error) {
//             return -1;
//         }
//         if (hours && minutes) return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
//         if (!hours && minutes) return parseInt(minutes) * 60 + parseInt(seconds);
//         if (!hours && !minutes) return parseInt(seconds);
//     },
//
//     secondsToString: function (seconds) {
//         var minutes = Math.floor((seconds % 3600) / 60);
//         var seconds = Math.floor(seconds % 60);
//         var resStr = '';
//         if (minutes < 10) resStr += '0' + minutes + ':';
//         else resStr += minutes + ':';
//         if (seconds < 10) resStr += '0' + seconds;
//         else resStr += seconds;
//         return resStr;
//     },
//
//     stringToSeconds: function (str) {
//         var times = str.split(':');
//         return (parseInt(times[0]) * 60) + parseInt(times[1]);
//     },
//
//     zip: function (arrays) {
//         return arrays[0].map(function (_, i) {
//             return arrays.map(function (array) {
//                 return array[i]
//             })
//         });
//     },
//
//     hashArrayFilter: function (hash, filter) {
//         var res = [];
//         for (i in hash) {
//             res.push(hash[i][filter]);
//         }
//         return res;
//     }
// };

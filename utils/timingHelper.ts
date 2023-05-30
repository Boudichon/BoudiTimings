import moment from "moment";

export interface Command {
  date: Date;
  displayDate: string;
}

export function parseCommands(fullCommands: string) {
  let allDates: Command[] = [];
  var allLines = fullCommands.split('\n');
  var lastManualDate: string = "";

  for (var i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim();

    if (!line || line === "") {
      continue;
    }

    // This part is for the planners that group the attacks by hour.
    // The date is on a header line and the individual commands only have the time.
    // We need to save the date from the header line to use it for the individual commands.
    if (line.startsWith("[b]") || line.startsWith("[s][b]")) {
      const cleanDateLine = cleanLineFromBoldTags(line);
      var possibleDate = cleanDateLine.match(/\d{4}-\d{2}-\d{2}/);
      if (possibleDate !== null) {
        lastManualDate = possibleDate[0];
      }
      continue;
    }

    const cleanLine = cleanLineFromBoldTags(line);
    var result = getTime(cleanLine, lastManualDate);

    if (!result) continue;

    var timeValue = result.date;
    var isSlash = result.isSlash;
    var isInverted = result.isInverted;

    if (!timeValue) continue;

    var dateToCheck = timeValue;
    if (isSlash) {
      dateToCheck = convertSlashDate(dateToCheck);
    } else if (isInverted) {
      dateToCheck = invertDashDate(dateToCheck);
    }

    var dateTimeGmtPlusOne = moment(dateToCheck).utcOffset("+01:00", true).toDate();

    var timing: Command = {
      date: dateTimeGmtPlusOne,
      displayDate: timeValue,
    };

    allDates.push(timing);
  }
  allDates.sort((a, b) => a.date?.getTime() - b.date?.getTime());
  return allDates;
}

function getTime(line: string, lastDateTime: string) {
  // Check full dates using dashes
  var times = line.match(/\b\d{2}:\d{2}:\d{2}\b/g); // example: 00:00:00
  var dates = line.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/g); // example: 2021-01-01 00:00:00
  var firstDate = null;
  var isSlash = false;
  var isInverted = false;

  if (!dates || dates.length == 0) {
    // Check full dates using slashes
    dates = line.match(/\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2}/g); // example: 01/01/2021 00:00:00
    isSlash = true;
  }

  if (!dates || dates.length == 0) {
    // Check full dates using inverted dashes
    dates = line.match(/\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2}/g); // example: 01-01-2021 00:00:00
    isInverted = true;
    isSlash = false;

    if (!dates?.length) isInverted = false;
  }

  if (!times?.length) {
    return null;
  }

  // If more times than dates, use the time and last time.
  if (!dates || (times?.length > dates?.length && times?.length < 3)) {
    firstDate = lastDateTime + " " + times[0];
  } else {
    firstDate = dates.reduce((a, b) => {
      return new Date(a) < new Date(b) ? a : b;
    });
  }
  return { date: firstDate, isSlash, isInverted };
}

// Remove bold tags from line
function cleanLineFromBoldTags(line: string) {
  return line.replaceAll("[b]", "").replaceAll("[/b]", "");
}

function invertDashDate(datetimeStr: string) {
  const [dateStr, timeStr] = datetimeStr.split(' '); // split date and time
  const [day, month, year] = dateStr.split('-'); // split date into day, month and year
  const formattedDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`; // format date string as "yyyy-mm-dd"

  const formattedDatetimeStr = `${formattedDateStr} ${timeStr}`; // combine formatted date and time strings
  return formattedDatetimeStr;
}

function convertSlashDate(datetimeStr: string) {
  const [dateStr, timeStr] = datetimeStr.split(' '); // split date and time
  const [day, month, year] = dateStr.split('/'); // split date into day, month and year
  const formattedDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`; // format date string as "yyyy-mm-dd"

  const formattedDatetimeStr = `${formattedDateStr} ${timeStr}`; // combine formatted date and time strings
  return formattedDatetimeStr;
}
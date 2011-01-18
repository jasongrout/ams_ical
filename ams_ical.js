/*
 Copyright (c) 2011 Jason Grout <jason.grout@drake.edu>
 
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 2 of the License, or
 (at your option) any later version.
 
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 
 */


// To use, just include this file using a <script> tag in the header, after including jquery

// or make a bookmarklet by just changing the following .js file URL
//javascript:void((function(){j=document.createElement("SCRIPT");j.src="http://code.jquery.com/jquery-latest.pack.js";document.getElementsByTagName("HEAD")[0].appendChild(j);})())


$(function() {
    $('ul>li').each(function(index) {$(this).prepend('<input type="checkbox"/>');});
$('input:checkbox').click(
    function() {
	$(this)
	    .parent('li')
	    .find('ul>li>input:checkbox')
	    .click();
    });
    }
);


getsessioninfo=function(t) {
    var session_date=parse_full_date($(t).children('a[name]')
				     .children('strong')
				     .text());
    var session_title=$(t).children('a[name]').text();
    var loc=$(t).children('small').text();
    var day=session_date.day;
    var start_time=session_date.start_time;
    var end_time=session_date.end_time;
    var text=$(t).text();
    return {
	start:datetime(day,start_time.hour, start_time.minute),
	end:datetime(day, end_time.hour, end_time.minute),
	loc:loc,
	authors:'',
	title:session_title,
	text:text,
	session_title:'',
	url:'',
    };
}

gettalkinfo=function(t) {
    var start_time_text=$(t).find('a[name]')
    if(start_time_text.length==0) {
	start_time_text=$(t).contents().filter(
	    function(){return this.nodeType==3;})
	    .first();
    }
    var start_time=parse_time(start_time_text.text());
    //    * session date
    var session_date=parse_full_date($(t).parent()
				     .closest('li')
				     .children('a[name]')
				     .children('strong')
				     .text());
    var session_title=$(t).parent()
	.closest('li')
	.children('a[name]')
	.text()
    //    * title: a with href attribute > em.text()
    var title=$(t).find('a[href]>em')
    if(title.length==0) {
	title=$(t).find('em');
    }
    title=title.text();
    //    * authors: each strong
    var authors=$(t).children('strong').text();
    // * extract place from parent li (small)
    var loc=$(t).parent().closest('li').children('small').text();
    
    // * figure out ending time:
    //   * if there is a next li, extract its time; t is the ending time
    var end_time;
    if($(t).next('li').length>0){
	end_time=parse_time($(t).next('li').text());
	// extract time from li
    } else {
	end_time=session_date.end_time;
    }
    var day=session_date.day;
    var text=$(t).text();
    var myurlnode=$(t).find('a[href]');
    var myurl='';
    if(myurlnode.length>0) {
	myurl=$(t).find('a[href]').attr('href');
    }
    return {
	start:datetime(day,start_time.hour, start_time.minute),
	end:datetime(day, end_time.hour, end_time.minute),
	loc:loc,
	authors:authors,
	title:title,
	text:text,
	session_title:session_title,
	url:'http://www.ams.org'+myurl,
    };
};

output_calendar=function(t) {
    var s="BEGIN:VCALENDAR\n";
    s+="METHOD:Request\n";
    s+="PRODID:-//Jason Grout AMS Scheduler///\n";
    s+="VERSION:2.0\n";
    for(var i=0; i<t.length; i++) {
	s+=output_vevent(t[i]);
    }
    s+="END:VCALENDAR";
    return s;
}

output_vevent=function(t) {
    // Determine if this is a subnode (like a talk in a session) 
    // or just a node (like an invited address that does not have 
    // talks inside of it).
    var info;
    var is_subtalk=$(t).parent().closest('li').children('input:checkbox').length>0;
    if(is_subtalk) {
	info=gettalkinfo(t);
    } else {
	info=getsessioninfo(t);
    }
    var s=""
    s+="BEGIN:VEVENT\n";
    s+="DTEND:"+info.end+"\n";
    s+="DTSTART:"+info.start+"\n";
    s+="SUMMARY:"+esc(info.authors)+"-"+esc(info.title)+"\n";
    s+="DESCRIPTION:"+esc(info.text)+"\n  --------------\n  "+esc(info.session_title)+"\n";
    s+="LOCATION:"+esc(info.loc)+"\n";
    s+="URL:"+esc(info.url)+"\n";
    s+="END:VEVENT\n";
    return s;
/*
DTEND:20100108T235900
DTSTART:20100108T230000
SUMMARY:summary
DESCRIPTION: Description
LOCATION:Rhythms I\, 2nd Floor\, Sheraton
URL:http://url.com
END:VEVENT
END:VCALENDAR
*/

};

esc=function(s) {
    s=s.split(',').join('\\,');
    s=s.split('\n').join('\n  ');
    return s;
}

time_regexp=new RegExp('([0-9]*):([0-9]*) (a.m.|p.m.)');

parse_time=function(s) {
    var m=time_regexp.exec(s);
    var hour=parseInt(m[1]);
    var min=parseInt(m[2]);
    if(m[3]=='p.m.') {hour+=12;}
    return {hour:hour, minute:min};
}
date_regexp=new RegExp('January ([0-9]), 2011, ([0-9apm.: ]*)-([0-9apm.: ]*)');

parse_full_date=function(s) {
    var m=date_regexp.exec(s);
    return {day:parseInt(m[1]),
	    start_time:parse_time(m[2]),
	    end_time:parse_time(m[3])};
}

datetime=function(day,hour,min) {
    var s="2011010";
    s+=day;
    s+="T";
    if(hour<10) {s+="0";}
    s+=hour;
    if(min<10) {s+="0";}
    s+=min;
    s+="00"
    return s;
}

$(function() {$('#generateics').click(function() {
    var ics=$('#ics');
    if(ics.length==0) {
	$('body').append('<pre id="ics"></pre>');
    ics=$('#ics');
    }
    var cal_nodes=$('input:checked').filter(
        function(index) {
            return $(this).parent().find('ul').length==0;
        }
    );
    ics.text(output_calendar(cal_nodes.parent()));
})});

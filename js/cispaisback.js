var $c = document.createElement.bind(document);
var IMG_HEIGHT = 80;
var scroll_listeners = {};


/**
    BaseModalController: Provides common functionality for modals. All modals
    extend this.
**/
var BaseModalController = Composer.Controller.extend({
    elements: {
        'div.overlay': 'overlay',
        'div.gutter': 'gutter'
    },
    events: {
        'click .gutter': 'click_close'
    },

    inject: 'body',

    base_render: function() {
        var div = $c('div');
        div.className = 'overlay invisible';
        var gutter = $c('div');
        gutter.className = 'gutter';
        div.appendChild(gutter);
        return div;
    },

    click_close: function(e) {
        e.preventDefault();
        if (e.target == this.gutter || e.target.className == 'close')
            this.hide();
    },

    show: function() {
        this.overlay.style.display = 'block';
        setTimeout(function() {
            this.overlay.className = 'overlay';
        }.bind(this), 50);
    },

    hide: function() {
        this.overlay.classList.add('invisible');

        if (typeof this.before_hide == 'function')
            this.before_hide();
        
        setTimeout(function() {
            this.release();
        }.bind(this), 400);
        
    }
});



/**
    ActionBarController: Provides events for the action bar (already rendered).
**/
var ActionBarController = Composer.Controller.extend({

    events: {
        'click a.twitter': 'tweet',
        'click a.facebook': 'share',
        'click a.donate': 'donate'
    },

    donate: function(e) {
        e.preventDefault();
        window.open('https://donate.fightforthefuture.org?tag='+TAG);
    },

    share: function(e) {
        e.preventDefault();
        window.open('https://www.facebook.com/sharer/sharer.php?u='+SITE_URL);
    },

    tweet: function(e) {
        e.preventDefault();
        var txt = encodeURIComponent(TWEET_TEXT+' '+SITE_URL);
        window.open('https://twitter.com/intent/tweet?text='+txt);
    }
});

/**
    CallActionController: Calls Congress
**/
var CallActionController = Composer.Controller.extend({

    elements: {
        'input[type=text]': 'phone'
    },

    events: {
        'submit form': 'submit',
        'click a.email': 'show_email_action'
    },

    submit: function(e) {
        e.preventDefault();
        
        var phone = this.phone.value;

        if (!this.validate_phone(phone))
            return alert('Please enter a valid US phone number!');

        var data = new FormData();
        data.append('campaignId', CALL_CAMPAIGN);
        data.append('userPhone', this.validate_phone(phone));

        var url = 'https://call-congress.fightforthefuture.org/create';

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                console.log('sent!', xhr.response);
            }
        }.bind(this);
        xhr.open("post", url, true);
        xhr.send(data);

        new CallActionModal();
    },

    validate_phone: function(num) {
        num = num.replace(/\s/g, '').replace(/\(/g, '').replace(/\)/g, '');
        num = num.replace("+", "").replace(/\-/g, '');

        if (num.charAt(0) == "1")
            num = num.substr(1);

        if (num.length != 10)
            return false;

        return num;
    },

    show_email_action: function(e) {
        if (e)
            e.preventDefault();
        this.el.className += ' invisible';
        var email_el = email_controller.el;

        setTimeout(function() {
            this.el.className += ' hidden';
            email_el.className = email_el.className.replace('hidden', '');

            setTimeout(function() {
                email_el.className = email_el.className.replace('invisible','');
            }, 50);
        }.bind(this), 500);
    }
});

/**
    CallActionModal: Shows instructions for calling Congress
**/
var CallActionModal = BaseModalController.extend({

    events: {
        'click a.close': 'click_close',
        'click a.twitter': 'tweet',
        'click a.facebook': 'share'
    },

    init: function() {
        this.render();
        this.show();
    },

    render: function() {
        var overlay = this.base_render();

        var div = $c('div');
        div.className = 'modal';
        
        var h2 = $c('h2');
        h2.textContent = CALL_MODAL_TITLE;
        div.appendChild(h2);

        var h3 = $c('h3');
        h3.textContent = CALL_MODAL_SUBTITLE;
        div.appendChild(h3);

        var p = $c('blockquote');
        p.innerHTML = '“' + CALL_MODAL_SCRIPT + '”';
        div.appendChild(p);

        var a = $c('a');
        a.className = 'close';
        a.textContent = '×';
        a.href = '#';
        div.appendChild(a);

        var a = $c('a');
        a.className = 'social twitter';
        a.href = '#';
        a.textContent = 'Tweet this';
        div.appendChild(a);

        var a = $c('a');
        a.className = 'social facebook';
        a.href = '#';
        a.textContent = 'Share this';
        div.appendChild(a);

        overlay.firstChild.appendChild(div);

        this.html(overlay);
    },

    share: function(e) {
        e.preventDefault();
        window.open('https://www.facebook.com/sharer/sharer.php?u='+SITE_URL);
    },

    tweet: function(e) {
        e.preventDefault();
        var txt = encodeURIComponent(TWEET_TEXT+' '+SITE_URL);
        window.open('https://twitter.com/intent/tweet?text='+txt);
    },

    before_hide: function() {
        call_controller.show_email_action();
        email_controller.set_title(POST_CALL_TITLE);
        email_controller.set_blurb(POST_CALL_BLURB);
    }

});

/**
    EmailActionController: Emails Congress
**/
var EmailActionController = Composer.Controller.extend({
    elements: {
        'h1': 'title',
        'p.blurb': 'blurb',
        'input[name=first_name]': 'first_name',
        'input[name=email]': 'email',
        'input[name=address1]': 'address1',
        'input[name=zip]': 'zip',
        'input[name=subject]': 'subject',
        'textarea': 'action_comment',
        'div.thanks': 'thanks',
        'form': 'form'
    },

    events: {
        'submit form': 'submit',
        'click a.twitter': 'tweet',
        'click a.facebook': 'share',
    },

    set_title: function(str) {
        console.log('trol: ',str);
        this.title.innerHTML = str;
    },

    set_blurb: function(str) {
        this.blurb.innerHTML = str;
    },

    submit: function(e) {
        e.preventDefault();
        console.log('submit');

        var error = false;

        var add_error = function(el) {
            el.className = 'error';
            error = true;
        };

        if (!this.first_name.value) add_error(this.first_name);
        if (!this.email.value) add_error(this.email);
        // if (!this.address1.value) add_error(this.address1);
        // if (!this.zip.value) add_error(this.zip);

        if (error) return alert('Please fill out all fields :)');

        var comment = this.action_comment.value;

        if (comment.indexOf('"', comment.length - 1) !== -1)
            comment = comment.substr(0, comment.length - 1);

        if (comment.indexOf('"') === 0)
            comment = comment.substr(1);

        console.log('comment: ', comment);

        var data = new FormData();
        data.append('guard', '');
        data.append('hp_enabled', true);
        data.append('member[first_name]', this.first_name.value);
        data.append('member[email]', this.email.value);
        data.append('member[street_address]', this.address1.value);
        data.append('member[postcode]', this.zip.value);
        data.append('action_comment', comment);
        data.append('tag', TAG);

        var url = 'https://queue.fightforthefuture.org/action';

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                console.log('response:', xhr.response);
            }
        }.bind(this);
        xhr.open("post", url, true);
        xhr.send(data);

        this.title.style.display = 'none';
        this.blurb.style.display = 'none';
        this.form.style.display = 'none';
        this.thanks.style.display = 'block';
    },

    share: function(e) {
        e.preventDefault();
        window.open('https://www.facebook.com/sharer/sharer.php?u='+SITE_URL);
    },

    tweet: function(e) {
        e.preventDefault();
        var txt = encodeURIComponent(TWEET_TEXT+' '+SITE_URL);
        window.open('https://twitter.com/intent/tweet?text='+txt);
    }
});

/**
    SenatorController: Shows a senator
**/
/*
var SenatorController = Composer.Controller.extend({

    events: {
        'click a.tw': 'tweet',
        'click h4': 'tweet',
        'click .img': 'tweet'
    },

    inject: '#targets',
    data: null,

    init: function() {
        this.render();
    },

    render: function() {
        var div = $c('div');

        var img = $c('div');
        img.style.background ='url(congress/'+this.data.image+') center center';
        img.style.backgroundSize = '100% auto';
        img.className = 'img';
        div.appendChild(img);

        var h4 = $c('h4');
        h4.textContent = this.data.name;
        div.appendChild(h4);        

        var ul = $c('ul');
        var li1 = $c('li');
        var a1 = $c('a');
        a1.href = 'tel://'+this.data.phone;
        a1.textContent = this.data.phone;
        li1.appendChild(a1);
        ul.appendChild(li1);
        var li2 = $c('li');
        var a2 = $c('a');
        a2.href = 'https://twitter.com/'+this.data.twitter;
        a2.className = 'tw';
        a2.textContent = '@'+this.data.twitter;
        li2.appendChild(a2);
        ul.appendChild(li2);
        div.appendChild(ul);
       
        this.html(div);
    },

    tweet: function(e) {
        e.preventDefault();
        var txt = encodeURIComponent('.@'+this.data.twitter+', please do everything in your power to block CISPA from passing in the NDAA! '+SITE_URL);
        window.open('https://twitter.com/intent/tweet?text='+txt);
    }

});
*/

// -----------------------------------------------------------------------------
// Actual functionality starts here :)
// -----------------------------------------------------------------------------


new ActionBarController({
    el: document.querySelector('.action_bar')
});

var email_controller = new EmailActionController({
    el: document.querySelector('.action.email')
});

var call_controller = new CallActionController({
    el: document.querySelector('.action.call')
});
if (window.location.href.indexOf('email=1') !== -1)
    call_controller.show_email_action();

/*
var targets = [
    {
        name: 'Rand Paul',
        twitter: 'RandPaul',
        phone: '(202) 224-4343',
        image: 'kypaulrand.jpg',
        party: 'R'
    },
    {
        name: 'Ted Cruz',
        twitter: 'SenTedCruz',
        phone: '(202) 224-5922',
        image: 'txcruzted.jpg',
        party: 'R'
    },
    {
        name: 'Mike Lee',
        twitter: 'SenMikeLee',
        phone: '(202) 224-5444',
        image: 'utleemike.jpg',
        party: 'R'
    },
    {
        name: 'Dean Heller',
        twitter: 'SenDeanHeller',
        phone: '(202) 224-6244',
        image: 'nvhellerdean.jpg',
        party: 'R'
    },
    {
        name: 'Cory Gardner',
        twitter: 'corygardner',
        phone: '(202) 224-5941',
        image: 'cogardnercory.jpg',
        party: 'R'
    },
    {
        name: 'Lisa Murkowski',
        twitter: 'LisaMurkowski',
        phone: '(202) 224-6665',
        image: 'akmurkowskilisa.jpg',
        party: 'R'
    },
    {
        name: 'Steve Daines',
        twitter: 'stevedaines',
        phone: '(202) 224-2651',
        image: 'mtdainessteve.jpg',
        party: 'R'
    },
    {
        name: 'Ron Johnson',
        twitter: 'SenRonJohnson',
        phone: '(202) 224-5323',
        image: 'wijohnsonron.jpg',
        party: 'R'
    },
    {
        name: 'Dan Sullivan',
        twitter: 'sendansullivan',
        phone: '(202) 224-3004',
        image: 'aksullivandan.jpg',
        party: 'R'
    },
    {
        name: 'Mike Enzi',
        twitter: 'SenatorEnzi',
        phone: '(202) 224-3424',
        image: 'wyenzimichaelb.jpg',
        party: 'R'
    },
    {
        name: 'Jerry Moran',
        twitter: 'JerryMoran',
        phone: '(202) 224-6521',
        image: 'ksmoranjerry.jpg',
        party: 'R'
    },
    {
        name: 'Shelly Moore Capito',
        twitter: 'sencapito',
        phone: '(202) 224-6472',
        image: 'wvcapitoshelley.jpg',
        party: 'R'
    },
    {
        name: 'Bill Cassidy',
        twitter: 'billcassidy',
        phone: '(202) 224-5824',
        image: 'lacassidybill.jpg',
        party: 'R'
    },
    {
        name: 'Mark Kirk',
        twitter: 'SenatorKirk',
        phone: '(202) 224-2854',
        image: 'ilkirkmarksteven.jpg',
        party: 'R'
    },
    {
        name: 'Ben Sasse',
        twitter: 'sensasse',
        phone: '(202) 224-4224',
        image: 'nesassebenjamin.jpg',
        party: 'R'
    },
    {
        name: 'Kelly Ayotte',
        twitter: 'KellyAyotte',
        phone: '(202) 224-3324',
        image: 'nhayottekelly.jpg',
        party: 'R'
    },
    {
        name: 'Jeff Flake',
        twitter: 'JeffFlake',
        phone: '(202) 224-4521',
        image: 'azflakejeff.jpg',
        party: 'R'
    },
    {
        name: 'John Boozman',
        twitter: 'JohnBoozman',
        phone: '(202) 224-4843',
        image: 'arboozmanjohn.jpg',
        party: 'R'
    },
    {
        name: 'Harry Reid',
        twitter: 'SenatorReid',
        phone: '(202) 224-3542',
        image: 'nvreidharry.jpg',
        party: 'D'
    },
    {
        name: 'Tom Carper',
        twitter: 'SenatorCarper',
        phone: '(202) 224-2441',
        image: 'decarperthomasr.jpg',
        party: 'D'
    },
    {
        name: 'Jack Reed',
        twitter: 'SenJackReed',
        phone: '(202) 224-4642',
        image: 'rireedjack.jpg',
        party: 'D'
    },
    {
        name: 'Kirsten Gillibrand',
        twitter: 'SenGillibrand',
        phone: '(202) 224-4451',
        image: 'nygillibrandkirstene.jpg',
        party: 'D'
    },
    {
        name: 'Debbie Stabenow',
        twitter: 'StabenowPress',
        phone: '(202) 224-4822',
        image: 'mistabenowdebbie.jpg',
        party: 'D'
    },
    {
        name: 'Bill Nelson',
        twitter: 'SenBillNelson',
        phone: '202-224-5274',
        image: 'flnelsonbill.jpg',
        party: 'D'
    },
    {
        name: 'Claire McCaskill',
        twitter: 'McCaskillOffice',
        phone: '(202) 224-6154',
        image: 'momccaskillclaire.jpg',
        party: 'D'
    },
    {
        name: 'Chuck Schumer',
        twitter: 'SenSchumer',
        phone: '(202) 224-6542',
        image: 'nyschumercharlese.jpg',
        party: 'D'
    },
    {
        name: 'Maria Cantwell',
        twitter: 'SenatorCantwell',
        phone: '(202) 224-3441',
        image: 'wacantwellmaria.jpg',
        party: 'D'
    },
    {
        name: 'Joe Manchin',
        twitter: 'Sen_JoeManchin',
        phone: '(202) 224-3954',
        image: 'wvmanchinjoeiii.jpg',
        party: 'D'
    },
    {
        name: 'Chris Murphy',
        twitter: 'ChrisMurphyCT',
        phone: '(202) 224-4041',
        image: 'ctmurphychristopher.jpg',
        party: 'D'
    },
    {
        name: 'Michael Bennet',
        twitter: 'SenBennetCo',
        phone: '202-224-5852',
        image: 'cobennetmichaelf.jpg',
        party: 'D'
    },
    {
        name: 'Tom Udall',
        twitter: 'SenatorTomUdall',
        phone: '(202) 224-6621',
        image: 'nmudalltom.jpg',
        party: 'D'
    },
    {
        name: 'Bob Casey',
        twitter: 'SenBobCasey',
        phone: '(202) 224-6324',
        image: 'pacaseybobjr.jpg',
        party: 'D'
    },
    {
        name: 'Martin Heinrich',
        twitter: 'MartinHeinrich',
        phone: '(202) 224-5521',
        image: 'nmheinrichmartint.jpg',
        party: 'D'
    },
    {
        name: 'Jon Tester',
        twitter: 'SenatorTester',
        phone: '(202) 224-2644',
        image: 'mttesterjon.jpg',
        party: 'D'
    },
    {
        name: 'Heidi Heitkamp',
        twitter: 'SenatorHeitkamp',
        phone: '(202) 224-2043',
        image: 'ndheitkampheidi.jpg',
        party: 'D'
    },
    {
        name: 'Brian Schatz',
        twitter: 'SenBrianSchatz',
        phone: '(202) 224-3934',
        image: 'hischatzbrian.jpg',
        party: 'D'
    },
    {
        name: 'Bob Mendendez',
        twitter: 'SenatorMenendez',
        phone: '202.224.4744',
        image: 'njmenendezrobert.jpg',
        party: 'D'
    },
];
for (var i = 0; i < targets.length; i++)
    new SenatorController({data: targets[i]});
*/
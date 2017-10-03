var map, largeInfowindow, bounds;

var LocationMarker = function( location ) {
    var self = this;

    this.title = location.title;
    this.location = location.location;

    this.visible = ko.observable( true );

    this.marker = new google.maps.Marker( {
        position: this.location,
        title: this.title,
        animation: google.maps.Animation.DROP
    } );

    this.marker.addListener( 'click', function() {
        populateInfoWindow( this, largeInfowindow, location );
        toggleBounce( this );
    } );

    self.filterMarkers = ko.computed( function () {
        if( self.visible() === true ) {
            self.marker.setMap( map );
            bounds.extend( self.marker.position );
            map.fitBounds( bounds );
        } else {
            self.marker.setMap( null );
        }
    } );

    // show item info when selected from list
    this.show = function( location ) {
        google.maps.event.trigger( self.marker, 'click' );
    };
};

/* This function populates the infowindow when the marker is clicked. We'll only allow one infowindow which will open at the marker that is cliecked, and populate based on that markers position.*/
function populateInfoWindow( marker, infowindow, location ) {

    var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll=' + location.location.lat + ',' +
        location.location.lng + '&client_id=JPJKGHZLW4RLR1MUYWC2JTNRLMIRXBWI0JQLRPVDNQFMWMWH&client_secret=DDZVFT2VJDR1MVH4DFGHTSKDQK2OZU4QUPUF2EDQMA41VKAG&v=20160118&query=' + location.title;
        
    $.getJSON( foursquareURL )
        .done( function( data ) {
            var url = ( typeof data.response.venues[0].url !== 'undefined' ) ? '<div><a href="' + data.response.venues[0].url + '" target ="_blank">' + data.response.venues[0].url + '</a></div>' : '';
            var address = ( typeof data.response.venues[0].location.address !== 'undefined' ) ? '<div>' + data.response.venues[0].location.address + '</div>' : '';
            var phone = ( typeof data.response.venues[0].contact.phone !== 'undefined' ) ? '<div>' + data.response.venues[0].contact.phone + '</div>' : '';
            
            var message = address + phone + url;
            openInfowindow( marker, infowindow, message );
        } )
        .fail( function() {
            var message = '<div>An error occured, no information is available at the moment.</div>';
            openInfowindow( marker, infowindow, message );
        } );
}

// function to open infowindow
function openInfowindow( marker, infowindow, message ) {
    // Check to make sure the infowindow is not already opened on this marker.
    if ( infowindow.marker != marker ) {
        infowindow.marker = marker;
        infowindow.setContent(
            '<h4>' + marker.title + '</h4>' + message 
        );
        infowindow.open( map, marker );
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener( 'closeclick', function() {
            infowindow.marker = null;
        } );
    }
}

// function to animate marker on click
function toggleBounce( marker ) {
    if ( marker.getAnimation() !== null ) {
        marker.setAnimation( null );
    } else {
        marker.setAnimation( google.maps.Animation.BOUNCE );
        window.setTimeout( function() {
            marker.setAnimation( null );
        }, 2100 );
    }
}

function AppViewModel() {

    var self = this;

    this.filter = ko.observable( '' );

    this.mapList = ko.observableArray( [] );

    map = new google.maps.Map( document.getElementById( 'map' ), {
        center: { lat: 47.8388, lng: 35.139567 },
        zoom: 13
    } );

    largeInfowindow = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();

    // add location markers for each location
    locations.forEach( function( location ) {
        self.mapList.push( new LocationMarker( location) );
    } );

    this.locationList = ko.computed( function() {

        var searchFilter = self.filter().toUpperCase();

        if ( searchFilter ) {
            return ko.utils.arrayFilter( self.mapList(), function( location ) {
                var string = location.title.toUpperCase();
                var result = string.includes( searchFilter );
                location.visible( result );
                return result;
            } );
        }

        self.mapList().forEach( function( location ) {
            location.visible( true );
        } );
        return self.mapList();

    }, self );

    self.toggleButton = function() {
        $( '.toggle-button' ).toggleClass( 'button-collapsed' );
        $( '.menu-container' ).toggleClass( 'menu-open' );
        $( '.body' ).toggleClass( 'body-slide-in' );
    };
}

function initApp() {
    ko.applyBindings( new AppViewModel() );
}
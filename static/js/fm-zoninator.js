;( function( $ ) {

	var FM_Zone = function( element, posts ) {
		var $container = $( element )
		  , obj = this
		  , tpl = _.template( $( '.fmz-post-template', $container ).html() )
		  , $search_field = $( '.zone-post-search', $container )
		;

		var after_sort = function( event, ui ) {
			// Reorder the sending container
			obj.reorder_posts();

			// Reorder the receiving container
			receiving_container = $( ui.item ).closest( '.fm-zone-posts-wrapper' );
			var zone = receiving_container.data( 'fm_zonify' );
			if ( zone ) {
				zone.reorder_posts();
				zone.remove_from_recents( $( ui.item ).data( 'post-id' ) );
			}
		}

		var add_post = function( post ) {
			post.i = $( '.zone-posts-list', $container ).children().length + 1;
			var $el = $( tpl( post ) ).hide();
			$( '.zone-posts-list', $container ).append( $el.fadeIn() );
			obj.remove_from_recents( post.id );
		}

		obj.remove_from_recents = function( id ) {
			$( '.zone-post-latest option[data-post-id="' + id + '"]', $container ).remove();
		}

		obj.reorder_posts = function() {
			var field_name = $container.data( 'name' );
			$( '.zone-post', $container ).each( function( index ) {
				$( '.zone-post-position', this ).text( index + 1 );
				$( 'input:hidden', this ).attr( 'name', field_name );
			} );
		}

		obj.get_current_ids = function() {
			return _.map( $( '.zone-post', $container ), function( el ) {
				return $( el ).data( 'post-id' );
			} );
		}

		$( '.zone-post-latest', $container ).change( function() {
			if ( $( this ).val() ) {
				try {
					post = JSON.parse( $( this ).val() );
					add_post( post );
				} catch ( e ) {
					// in case the JSON is invalid
				}
			}
		} );

		$( '.zone-posts-list', $container ).sortable( {
			stop: after_sort
			, connectWith: '.fm-zone-posts-connected .zone-posts-list'
			, placeholder: 'ui-state-highlight'
			, forcePlaceholderSize: true
		} );

		$container.on( 'click', '.delete', function( e ) {
			e.preventDefault();
			$( this ).closest( '.zone-post' ).fadeOut( 'normal', function() { $( this ).remove(); } );
		} );

		$search_field
			.bind( 'loading.start', function( e ) {
				$( this ).addClass( 'loading' );
			} )
			.bind( 'loading.end', function( e ) {
				$( this ).removeClass( 'loading' );
			} )
			.autocomplete( {
				minLength: 3
				, appendTo: $container
				, delay: 500
				, source: function( request, response ) {
					// Append more request vars
					request.action = $search_field.data( 'action' );
					request._nonce = $search_field.data( 'nonce' );
					request.fm_context = $search_field.data( 'context' ),
					request.fm_subcontext = $search_field.data( 'subcontext' ),
					request.exclude = obj.get_current_ids();


					var acajax = $.post( ajaxurl, request, function( data, status, xhr ) {
						if ( xhr === acajax ) {
							response( data.data );
						}
						$search_field.trigger( 'loading.end' );
					}, 'json' );
				}
				, select: function( e, ui ) {
					add_post( ui.item );
				}
				, search: function( e, ui ) {
					$search_field.trigger( 'loading.start' );
				}
			} );

		/* Manipulate the results */
		var autocomplete = $search_field.data( 'autocomplete' ) || $search_field.data( 'ui-autocomplete' );
		autocomplete._renderItem = function( ul, item ) {
			var content = '<a>'
				+ '<span class="image">' + item.thumb + '</span>'
				+ '<span class="details">'
					+ '<span class="title">' + item.title + '</span>'
					+ '<span class="type">' + item.post_type + '</span>'
					+ '<span class="date">' + item.date + '</span>'
					+ '<span class="status">' + item.post_status + '</span>'
				+ '</span>'
				+ '</a>';
			return $( '<li></li>' )
				.data( 'item.autocomplete', item )
				.append( content )
				.appendTo( ul )
				;
		}

		// Lastly, populate with existing data
		_.each( posts, add_post );
	};


	$.fn.fm_zonify = function( posts ) {
		return this.each( function() {
			var $element = $( this );

			// Return early if this element already has a plugin instance
			if ( $element.data( 'fm_zonify' ) ) {
				return;
			}

			// Instantiate our object
			var fm_zone = new FM_Zone( this, posts );

			// Store plugin object in this element's data
			$element.data( 'fm_zonify', fm_zone );
		} );
	};


	$( document ).ready( function() {
		$( '.fm-zone-posts-wrapper' ).each( function() {
			var posts = [];
			if ( $( this ).data( 'current' ) ) {
				try {
					posts = $( this ).data( 'current' );
				} catch ( e ) {
					// in case the JSON is invalid
				}
			}

			$( this ).fm_zonify( posts );
		} );
	} );

} )( jQuery );

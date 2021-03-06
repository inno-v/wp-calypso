/**
 * External dependencies
 */
var React = require( 'react' );

/**
 * Internal dependencies
 */
var preventWidows = require( 'lib/formatting' ).preventWidows;

module.exports = React.createClass( {
	displayName: 'StepHeader',

	render: function() {
		return (
			<header className="step-header">
				<h1 className="step-header__title">{ preventWidows( this.props.headerText, 2 ) }</h1>
				<p className="step-header__subtitle">{ preventWidows( this.props.subHeaderText, 2 ) }</p>
			</header>
		);
	}
} );

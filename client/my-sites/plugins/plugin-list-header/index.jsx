/**
 * External dependencies
 */
import React from 'react';
import property from 'lodash/utility/property';
import debounce from 'lodash/function/debounce';
import config from 'config';
import { findDOMNode } from 'react-dom';
import classNames from 'classnames';
import analytics from 'analytics';

/**
 * Internal dependencies
 */
import SectionHeader from 'components/section-header';
import ButtonGroup from 'components/button-group';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import SelectDropdown from 'components/select-dropdown';
import DropdownItem from 'components/select-dropdown/item';
import DropdownSeparator from 'components/select-dropdown/separator';
import BulkSelect from 'components/bulk-select';

let _actionBarVisible = true;

// If the Action
const MAX_ACTIONBAR_HEIGHT = 50;
const MIN_ACTIONBAR_WIDTH = 600;

export default React.createClass( {
	displayName: 'Plugins-list-header',

	propTypes: {
		label: React.PropTypes.string,
		isBulkManagementActive: React.PropTypes.bool,
		toggleBulkManagement: React.PropTypes.func.isRequired,
		updateAllPlugins: React.PropTypes.func.isRequired,
		updateSelected: React.PropTypes.func.isRequired,
		haveUpdatesSelected: React.PropTypes.bool,
		pluginUpdateCount: React.PropTypes.number.isRequired,
		activateSelected: React.PropTypes.func.isRequired,
		deactiveAndDisconnectSelected: React.PropTypes.func.isRequired,
		deactivateSelected: React.PropTypes.func.isRequired,
		setAutoupdateSelected: React.PropTypes.func.isRequired,
		setSelectionState: React.PropTypes.func.isRequired,
		unsetAutoupdateSelected: React.PropTypes.func.isRequired,
		removePluginNotice: React.PropTypes.func.isRequired,
		haveActiveSelected: React.PropTypes.bool,
		haveInactiveSelected: React.PropTypes.bool,
		bulkManagement: React.PropTypes.bool,
		sites: React.PropTypes.object.isRequired,
		plugins: React.PropTypes.array.isRequired,
		selected: React.PropTypes.array.isRequired,
		isWpCom: React.PropTypes.bool
	},

	getDefaultProps() {
		return {
			isWpCom: false
		};
	},

	getInitialState() {
		return {
			actionBarVisible: _actionBarVisible
		};
	},

	componentDidMount() {
		this.debouncedAfterResize = debounce( this.afterResize, 100 );
		window.addEventListener( 'resize', this.debouncedAfterResize );
	},

	componentWillUnmount() {
		window.removeEventListener( 'resize', this.debouncedAfterResize );
	},

	afterResize() {
		if ( this.props.isBulkManagementActive ) {
			this.maybeMakeActionBarVisible();
		}
	},

	maybeMakeActionBarVisible() {
		const actionBarDomElement = findDOMNode( this );
		if ( actionBarDomElement.offsetWidth < MIN_ACTIONBAR_WIDTH ) {
			return;
		}
		this.setState( { actionBarVisible: true } );
		setTimeout( () => {
			const actionBarVisible = actionBarDomElement.offsetHeight <= MAX_ACTIONBAR_HEIGHT;
			this.setState( { actionBarVisible } );
		}, 1 );
	},

	toggleBulkManagement() {
		this.props.toggleBulkManagement();

		this.maybeMakeActionBarVisible();
	},

	onBrowserLinkClick() {
		analytics.ga.recordEvent( 'Plugins', 'Clicked Add New Plugins' );
	},

	canAddNewPlugins() {
		return config.isEnabled( 'manage/plugins/browser' ) && ! this.props.isWpCom;
	},

	canUpdatePlugins() {
		return this.props.selected.some( plugin => plugin.sites.some( site => site.canUpdateFiles ) );
	},

	unselectOrSelectAll() {
		const someSelected = this.props.selected.length > 0;
		this.props.setSelectionState( this.props.plugins, ! someSelected );
		analytics.ga.recordEvent( 'Plugins', someSelected ? 'Clicked to Uncheck All Plugins' : 'Clicked to Check All Plugins' );
	},

	renderCurrentActionButtons() {
		const { isWpCom } = this.props;
		let buttons = [];
		let rightSideButtons = [];
		let leftSideButtons = [];
		let autoupdateButtons = [];
		let activateButtons = [];

		const hasWpcomPlugins = this.props.selected.some( property( 'wpcom' ) );
		const isJetpackSelected = this.props.selected.some( plugin => 'jetpack' === plugin.slug );
		const needsRemoveButton = this.props.selected.length && ! hasWpcomPlugins && this.canUpdatePlugins() && ! isJetpackSelected;
		if ( ! this.props.isBulkManagementActive ) {
			if ( ! isWpCom && 0 < this.props.pluginUpdateCount ) {
				rightSideButtons.push(
					<ButtonGroup key="plugin-list-header__buttons-update-all">
						<Button compact primary onClick={ this.props.updateAllPlugins } >
							{ this.translate( 'Update All', { context: 'button label' } ) }
						</Button>
					</ButtonGroup>
				);
			}
			rightSideButtons.push(
				<ButtonGroup key="plugin-list-header__buttons-bulk-management">
					<Button compact onClick={ this.toggleBulkManagement }>
						{ this.translate( 'Edit All', { context: 'button label' } ) }
					</Button>
				</ButtonGroup>
			);
			if ( ! isWpCom && this.canAddNewPlugins() ) {
				const selectedSite = this.props.sites.getSelectedSite();
				const browserUrl = '/plugins/browse' + ( selectedSite ? '/' + selectedSite.slug : '' );

				rightSideButtons.push(
					<ButtonGroup key="plugin-list-header__buttons-browser">
						<Button compact href={ browserUrl } onClick={ this.onBrowserLinkClick } className="plugin-list-header__browser-button">
							<Gridicon key="plus-icon" icon="plus-small" size={ 12 } /><Gridicon key="plugins-icon" icon="plugins" size={ 18 } />
						</Button>
					</ButtonGroup>
				);
			}
		} else {
			if ( ! isWpCom ) {
				const updateButton = (
					<Button
						key="plugin-list-header__buttons-update"
						disabled={ ! this.props.haveUpdatesSelected }
						compact primary
						onClick={ this.props.updateSelected }>
						{ this.translate( 'Update' ) }
					</Button>
				);
				leftSideButtons.push( <ButtonGroup key="plugin-list-header__buttons-update-button">{ updateButton }</ButtonGroup> );
			}

			activateButtons.push(
				<Button key="plugin-list-header__buttons-activate" disabled={ ! this.props.haveInactiveSelected } compact onClick={ this.props.activateSelected }>
					{ this.translate( 'Activate' ) }
				</Button>
			);
			let deactivateButton = isJetpackSelected
				? (
					<Button compact
						key="plugin-list-header__buttons-deactivate"
						disabled={ ! this.props.haveActiveSelected }
						onClick={ this.props.deactiveAndDisconnectSelected }>
						{ this.translate( 'Disconnect' ) }
					</Button>
				)
				: (
					<Button compact
						key="plugin-list-header__buttons-disable"
						disabled={ ! this.props.haveActiveSelected }
						onClick={ this.props.deactivateSelected }>
						{ this.translate( 'Deactivate' ) }
					</Button>
				);
			activateButtons.push( deactivateButton )
			leftSideButtons.push( <ButtonGroup key="plugin-list-header__buttons-activate-buttons">{ activateButtons }</ButtonGroup> );

			if ( ! isWpCom ) {
				autoupdateButtons.push(
					<Button key="plugin-list-header__buttons-autoupdate-on"
						disabled={ hasWpcomPlugins || ! this.canUpdatePlugins() }
						compact
						onClick={ this.props.setAutoupdateSelected }>
						{ this.translate( 'Autoupdate' ) }
					</Button>
				);
				autoupdateButtons.push(
					<Button key="plugin-list-header__buttons-autoupdate-off"
						disabled={ hasWpcomPlugins || ! this.canUpdatePlugins() }
						compact
						onClick={ this.props.unsetAutoupdateSelected }>
						{ this.translate( 'Disable Autoupdates' ) }
					</Button>
				);

				leftSideButtons.push( <ButtonGroup key="plugin-list-header__buttons-update-buttons">{ autoupdateButtons }</ButtonGroup> );
				leftSideButtons.push(
					<ButtonGroup key="plugin-list-header__buttons-remove-button">
						<Button compact scary
							disabled={ ! needsRemoveButton }
							onClick={ this.props.removePluginNotice }>
							{ this.translate( 'Remove' ) }
						</Button>
					</ButtonGroup>
				);
			}

			rightSideButtons.push(
				<button key="plugin-list-header__buttons-close-button"
					className="plugin-list-header__section-actions-close"
					onClick={ this.props.toggleBulkManagement }>
					<span className="screen-reader-text">{ this.translate( 'Close' ) }</span>
					<Gridicon icon="cross" />
				</button>
			);
		}

		buttons.push( <span key="plugin-list-header__buttons-action-buttons" className="plugin-list-header__action-buttons">{ leftSideButtons }</span> );
		buttons.push( <span key="plugin-list-header__buttons-global-buttons" className="plugin-list-header__mode-buttons">{ rightSideButtons }</span> );

		return buttons;
	},

	renderCurrentActionDropdown() {
		const { isWpCom } = this.props;
		let options = [];
		let actions = [];

		const hasWpcomPlugins = this.props.selected.some( property( 'wpcom' ) );
		const isJetpackSelected = this.props.selected.some( plugin => 'jetpack' === plugin.slug );
		const needsRemoveButton = !! this.props.selected.length && ! hasWpcomPlugins && this.canUpdatePlugins() && ! isJetpackSelected;

		if ( this.props.isBulkManagementActive ) {
			options.push( <DropdownItem key="plugin__actions_title" selected={ true } value="Actions">{ this.translate( 'Actions' ) }</DropdownItem> );

			if ( ! isWpCom ) {
				options.push( <DropdownSeparator key="plugin__actions_separator_1" /> );
				options.push(
					<DropdownItem key="plugin__actions_activate"
						disabled={ ! this.props.haveUpdatesSelected }
						onClick={ this.props.updateSelected }>
						{ this.translate( 'Update' ) }
					</DropdownItem>
				);
			}

			options.push( <DropdownSeparator key="plugin__actions_separator_1" /> );
			options.push(
				<DropdownItem key="plugin__actions_activate"
					disabled={ ! this.props.haveInactiveSelected }
					onClick={ this.props.activateSelected }>
					{ this.translate( 'Activate' ) }
				</DropdownItem>
			);

			let deactivateAction = isJetpackSelected
				? <DropdownItem key="plugin__actions_disconnect"
					disabled={ ! this.props.haveActiveSelected }
					onClick={ this.props.deactiveAndDisconnectSelected }>
						{ this.translate( 'Disconnect' ) }
					</DropdownItem>
				: <DropdownItem key="plugin__actions_deactivate"
					disabled={ ! this.props.haveActiveSelected }
					onClick={ this.props.deactivateSelected }>
						{ this.translate( 'Deactivate' ) }
					</DropdownItem>;
			options.push( deactivateAction );

			if ( ! isWpCom ) {
				options.push( <DropdownSeparator key="plugin__actions_separator_2" /> );
				options.push(
					<DropdownItem key="plugin__actions_autoupdate"
						disabled={ hasWpcomPlugins || ! this.canUpdatePlugins() }
						onClick={ this.props.setAutoupdateSelected }>
						{ this.translate( 'Autoupdate' ) }
					</DropdownItem>
				);
				options.push(
					<DropdownItem key="plugin__actions_disable_autoupdate"
						disabled={ hasWpcomPlugins || ! this.canUpdatePlugins() }
						onClick={ this.props.unsetAutoupdateSelected }>
						{ this.translate( 'Disable Autoupdates' ) }
					</DropdownItem>
				);

				options.push( <DropdownSeparator key="plugin__actions_separator_3" /> );
				options.push(
					<DropdownItem key="plugin__actions_remove"
						className="plugin-list-header__actions_remove_item"
						disabled={ ! needsRemoveButton }
						onClick={ this.props.removePluginNotice } >
						{ this.translate( 'Remove' ) }
					</DropdownItem>
				);
			}

			actions.push(
				<SelectDropdown compact
					className="plugin-list-header__actions_dropdown"
					key="plugin-list-header__actions_dropdown"
					selectedText={ this.translate( 'Actions' ) }>
					{ options }
				</SelectDropdown>
			);
		}
		return actions;
	},

	render() {
		const sectionClasses = classNames( 'plugin-list-header', { 'is-bulk-editing': this.props.isBulkManagementActive, 'is-action-bar-visible': this.state.actionBarVisible } );
		return (
			<SectionHeader label={ this.props.label } className={ sectionClasses }>
				{
					this.props.isBulkManagementActive &&
						<BulkSelect key="plugin-list-header__bulk-select"
							totalElements={ this.props.plugins.length }
							selectedElements={ this.props.selected.length }
							onToggle={ this.unselectOrSelectAll } />
				}
				{ this.renderCurrentActionDropdown() }
				{ this.renderCurrentActionButtons() }
			</SectionHeader>
		);
	}
} );

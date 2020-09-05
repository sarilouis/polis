// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

/** @jsx jsx */

import React from 'react'
import { connect } from 'react-redux'
import {
  handleZidMetadataUpdate,
  optimisticZidMetadataUpdateOnTyping
} from '../../actions'
import ComponentHelpers from '../../util/component-helpers'
import NoPermission from './no-permission'
import { Heading, Box, Flex, Text, jsx, Label } from 'theme-ui'
import emoji from 'react-easy-emoji'

import ModerateCommentsSeed from './seed-comment'
// import ModerateCommentsSeedTweet from "./seed-tweet";

@connect(state => state.user)
@connect(state => state.zid_metadata)
class ConversationConfig extends React.Component {
  handleBoolValueChange(field) {
    return () => {
      var val = this[field].checked
      if (field === 'bgcolor') {
        // gray checked=default, unchecked white
        val = val ? 'default' : '#fff'
      }
      this.props.dispatch(
        handleZidMetadataUpdate(this.props.zid_metadata, field, val)
      )
    }
  }

  transformBoolToInt(value , f=0, t=1) {
    return value ? t : f
  }

  handleIntegerBoolValueChange(field , f=0, t=1, element = field) {
    return () => {
      this.props.dispatch(
        handleZidMetadataUpdate(
          this.props.zid_metadata,
          field,
          this.transformBoolToInt(this[element].checked , f , t)
        )
      )
    }
  }

  handleStringValueChange(field) {
    return () => {
      let val = this[field].value
      if (field === 'help_bgcolor' || field === 'help_color') {
        if (!val.length) {
          val = 'default'
        }
      }
      this.props.dispatch(
        handleZidMetadataUpdate(this.props.zid_metadata, field, val)
      )
    }
  }

  handleRadioValueChange(field) {
    return e => {
      this.props.dispatch(
        handleZidMetadataUpdate(this.props.zid_metadata, field, e.target.value)
      )
    }
  }

  handleConfigInputTyping(field) {
    return e => {
      this.props.dispatch(
        optimisticZidMetadataUpdateOnTyping(
          this.props.zid_metadata,
          field,
          e.target.value
        )
      )
    }
  }

  render() {
    if (ComponentHelpers.shouldShowPermissionsError(this.props)) {
      return <NoPermission />
    }

    return (
      <Box>
        <Heading
          as="h3"
          sx={{
            fontSize: [3, null, 4],
            lineHeight: 'body',
            mb: [3, null, 4]
          }}>
          Configure
        </Heading>
        <Box sx={{ mb: [4] }}>
          {this.props.loading ? (
            <Text>{emoji('💾')} Saving</Text>
          ) : (
            <Text>{emoji('⚡')} Up to date</Text>
          )}
          {this.props.error ? <Text>Error Saving</Text> : null}
        </Box>
        <Box sx={{ mb: [3] }}>
          <Text sx={{ mb: [2] }}>Topic</Text>
          <input
            ref={c => (this.topic = c)}
            sx={{
              fontFamily: 'body',
              fontSize: [2],
              width: '35em',
              borderRadius: 2,
              padding: [2],
              border: '1px solid',
              borderColor: 'mediumGray'
            }}
            onBlur={this.handleStringValueChange('topic').bind(this)}
            onChange={this.handleConfigInputTyping('topic').bind(this)}
            defaultValue={this.props.zid_metadata.topic}
          />
        </Box>

        <Box sx={{ mb: [3] }}>
          <Text sx={{ mb: [2] }}>Description</Text>
          <textarea
            ref={c => (this.description = c)}
            sx={{
              fontFamily: 'body',
              fontSize: [2],
              width: '35em',
              height: '7em',
              resize: 'none',
              padding: [2],
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'mediumGray'
            }}
            onBlur={this.handleStringValueChange('description').bind(this)}
            onChange={this.handleConfigInputTyping('description').bind(this)}
            defaultValue={this.props.zid_metadata.description}
          />
        </Box>

        <Heading
          as="h6"
          sx={{
            fontSize: [1, null, 2],
            lineHeight: 'body',
            my: [3, null, 4]
          }}>
          Seed Comments
        </Heading>
        <ModerateCommentsSeed
          params={{ conversation_id: this.props.zid_metadata.conversation_id }}
        />

        {/* <ModerateCommentsSeedTweet
          params={{ conversation_id: this.props.zid_metadata.conversation_id }}
        /> */}

        <Heading
          as="h6"
          sx={{
            fontSize: [1, null, 2],
            lineHeight: 'body',
            my: [3, null, 4]
          }}>
          Customize the user interface
        </Heading>

        <Flex sx={{ alignItems: 'flex-start', mb: [3] }}>
          <Box sx={{ flexShrink: 0, position: 'relative', top: -0.5 }}>
            <input
              type="checkbox"
              label="Visualization"
              data-test-id="vis_type"
              ref={c => (this.vis_type = c)}
              checked={this.props.zid_metadata.vis_type === 1}
              onChange={this.handleIntegerBoolValueChange('vis_type').bind(
                this
              )}
            />
          </Box>
          <Box sx={{ ml: [2], flexShrink: 0, maxWidth: '35em' }}>
            <Text>Participants can see the visualization</Text>
          </Box>
        </Flex>

        <Flex sx={{ alignItems: 'flex-start', mb: [3] }}>
          <Box sx={{ flexShrink: 0, position: 'relative', top: -0.5 }}>
            <input
              type="checkbox"
              label="Comment form"
              data-test-id="write_type"
              ref={c => (this.write_type = c)}
              checked={this.props.zid_metadata.write_type === 1}
              onChange={this.handleIntegerBoolValueChange('write_type').bind(
                this
              )}
            />
          </Box>
          <Box sx={{ ml: [2], flexShrink: 0, maxWidth: '35em' }}>
            <Text>Participants can submit comments</Text>
          </Box>
        </Flex>

        <Flex sx={{ alignItems: 'flex-start', mb: [3] }}>
          <Box sx={{ flexShrink: 0, position: 'relative', top: -0.5 }}>
            <input
              type="checkbox"
              label="Help text"
              data-test-id="help_type"
              ref={c => (this.help_type = c)}
              checked={this.props.zid_metadata.help_type === 1}
              onChange={this.handleIntegerBoolValueChange('help_type').bind(
                this
              )}
            />
          </Box>
          <Box sx={{ ml: [2], flexShrink: 0, maxWidth: '35em' }}>
            <Text>Show explanation text above voting and visualization</Text>
          </Box>
        </Flex>
        
        <Flex sx={{ alignItems: 'flex-start', mb: [3] }}>
          <Box sx={{ flexShrink: 0, position: 'relative', top: -0.5 }}>
            <input
              type="checkbox"
              label="Facebook login prompt"
              data-test-id="auth_opt_fb"
              ref={c => (this.auth_opt_fb = c)}
              checked={this.props.zid_metadata.auth_opt_fb}
              onChange={this.handleBoolValueChange('auth_opt_fb').bind(this)}
            />
          </Box>
          <Box sx={{ ml: [2], flexShrink: 0, maxWidth: '35em' }}>
            <Text>Show Facebook login prompt</Text>
          </Box>
        </Flex>

        <Flex sx={{ alignItems: 'flex-start', mb: [3] }}>
          <Box sx={{ flexShrink: 0, position: 'relative', top: -0.5 }}>
            <input
              type="checkbox"
              label="Twitter login prompt"
              data-test-id="auth_opt_tw"
              ref={c => (this.auth_opt_tw = c)}
              checked={this.props.zid_metadata.auth_opt_tw}
              onChange={this.handleBoolValueChange('auth_opt_tw').bind(this)}
            />
          </Box>
          <Box sx={{ ml: [2], flexShrink: 0, maxWidth: '35em' }}>
            <Text>Show Twitter login prompt</Text>
          </Box>
        </Flex>

        <Heading
          as="h6"
          sx={{
            fontSize: [1, null, 2],
            lineHeight: 'body',
            my: [3, null, 4]
          }}>
          Prompt for notification subscription
        </Heading>

        <Flex sx={{ alignItems: 'flex-start', mb: [3] }}>
          <Box>
            <Text>
              Prompt participants to subscribe to updates. A prompt is shown to
              users once they finish voting on all available comments. If
              enabled, participants may optionally provide their email address
              or enable browser push notifications to receive a message when
              there are new comments to vote on.
            </Text>
          </Box>
        </Flex>

        <Flex sx={{ alignItems: 'flex-start', mb: [3] }}>
          <Box sx={{ flexShrink: 0, position: 'relative', top: -0.5 }}>
            <input
              type="radio"
              label="Do not prompt participants to subscribe"
              id="subscribe_type_r0"
              value="0"
              checked={this.props.zid_metadata.subscribe_type === 0}
              onChange={this.handleRadioValueChange('subscribe_type').bind(this)}
            />
          </Box>
          <Box sx={{ ml: [2], flexShrink: 0, maxWidth: '35em' }}>
            <Label htmlFor="subscribe_type_r0">
              No prompt
            </Label>
          </Box>
        </Flex>

        <Flex sx={{ alignItems: 'flex-start', mb: [3] }}>
          <Box sx={{ flexShrink: 0, position: 'relative', top: -0.5 }}>
            <input
              type="radio"
              label="Prompt participants to subscribe to updates by email"
              id="subscribe_type_r1"
              value="1"
              checked={this.props.zid_metadata.subscribe_type === 1}
              onChange={this.handleRadioValueChange('subscribe_type').bind(this)}
            />
          </Box>
          <Box sx={{ ml: [2], flexShrink: 0, maxWidth: '35em' }}>
            <Label htmlFor="subscribe_type_r1">
              Email notifications prompt
            </Label>
          </Box>
        </Flex>

        <Flex sx={{ alignItems: 'flex-start', mb: [3] }}>
          <Box sx={{ flexShrink: 0, position: 'relative', top: -0.5 }}>
            <input
              type="radio"
              label="Prompt participants to subscribe to updates in browser"
              id="subscribe_type_r2"
              value="2"
              checked={this.props.zid_metadata.subscribe_type === 2}
              onChange={this.handleRadioValueChange('subscribe_type').bind(this)}
            />
          </Box>
          <Box sx={{ ml: [2], flexShrink: 0, maxWidth: '35em' }}>
            <Label htmlFor="subscribe_type_r2">
              Browser notifications prompt
            </Label>
          </Box>
        </Flex>

        <Heading
          as="h6"
          sx={{
            fontSize: [1, null, 2],
            lineHeight: 'body',
            my: [3, null, 4]
          }}>
          Schemes
        </Heading>

        <Flex sx={{ alignItems: 'flex-start', mb: [3] }}>
          <Box sx={{ flexShrink: 0, position: 'relative', top: -0.5 }}>
            <input
              type="checkbox"
              data-test-id="strict_moderation"
              ref={c => (this.strict_moderation = c)}
              checked={this.props.zid_metadata.strict_moderation}
              onChange={this.handleBoolValueChange('strict_moderation').bind(
                this
              )}
            />
          </Box>
          <Box sx={{ ml: [2], flexShrink: 0, maxWidth: '35em' }}>
            <Text>No comments shown without moderator approval</Text>
          </Box>
        </Flex>

        <Flex sx={{ alignItems: 'flex-start', mb: [3] }}>
          <Box sx={{ flexShrink: 0, position: 'relative', top: -0.5 }}>
            <input
              type="checkbox"
              label="Require Auth to Comment"
              data-test-id="auth_needed_to_write"
              ref={c => (this.auth_needed_to_write = c)}
              checked={this.props.zid_metadata.auth_needed_to_write}
              onChange={this.handleBoolValueChange('auth_needed_to_write').bind(
                this
              )}
            />
          </Box>
          <Box sx={{ ml: [2], flexShrink: 0, maxWidth: '35em' }}>
            <Text>
              Participants cannot submit comments without first connecting
              either Facebook or Twitter
            </Text>
          </Box>
        </Flex>

        <Flex sx={{ alignItems: 'flex-start', mb: [3] }}>
          <Box sx={{ flexShrink: 0, position: 'relative', top: -0.5 }}>
            <input
              type="checkbox"
              label="Require Auth to Vote"
              data-test-id="auth_needed_to_vote"
              ref={c => (this.auth_needed_to_vote = c)}
              checked={this.props.zid_metadata.auth_needed_to_vote}
              onChange={this.handleBoolValueChange('auth_needed_to_vote').bind(
                this
              )}
            />
          </Box>
          <Box sx={{ ml: [2], flexShrink: 0, maxWidth: '35em' }}>
            <Text>
              Participants cannot vote without first connecting either Facebook
              or Twitter
            </Text>
          </Box>
        </Flex>
      </Box>
    )
  }
}

export default ConversationConfig

// checked={this.props.zid_metadata.is_data_open}
// Comments, votes, and group data can be exported by any user

/* <InputField
            ref={"style_btn"}

            style={{ width: 360 }}
            onBlur={this.handleStringValueChange("style_btn").bind(this)}
            hintText="ie., #e63082"
            onChange={this.handleConfigInputTyping("style_btn")}
            value={this.props.zid_metadata.style_btn}
            floatingLabelText={
              "Customize submit button color" + (canCustomizeColors ? "" : lockedIcon)
            }
            multiLine={true}
          /> */

/* <InputField
            ref={"help_bgcolor"}

            style={{ width: 360 }}
            onBlur={this.handleStringValueChange("help_bgcolor").bind(this)}
            onChange={this.handleConfigInputTyping("help_bgcolor")}
            value={this.props.zid_metadata.help_bgcolor}
            hintText="ie., #e63082"
            floatingLabelText={
              "Customize help text background" + (canCustomizeColors ? "" : lockedIcon)
            }
            multiLine={true}
          /> */

/* <InputField
            ref={"help_color"}

            style={{ width: 360 }}
            onBlur={this.handleStringValueChange("help_color").bind(this)}
            onChange={this.handleConfigInputTyping("help_color")}
            value={this.props.zid_metadata.help_color}
            hintText="ie., #e63082"
            floatingLabelText={"Customize help text color" + (canCustomizeColors ? "" : lockedIcon)}
            multiLine={true}
          /> */

/* <Checkbox
            label="Social sharing buttons"
            ref={"socialbtn_type"}
            checked={this.props.zid_metadata.socialbtn_type === 1 ? true : false}
            onCheck={this.handleIntegerBoolValueChange("socialbtn_type").bind(this)}


          /> */

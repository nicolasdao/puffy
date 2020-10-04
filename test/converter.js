/**
 * Copyright (c) 2020, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

// To skip a test, either use 'xit' instead of 'it', or 'describe.skip' instead of 'describe'

const { assert } = require('chai')
const { converter: { objectS2Ccase, s2cCase, objectCapital2Ccase } } = require('../src')

describe('converter', () => {
	describe('#s2cCase', () => {
		it('Should convert a snake case string to camel case.', () => {
			assert.equal(s2cCase('moreInfo'), 'moreInfo','01')
			assert.equal(s2cCase('first_name'), 'firstName','02')
			assert.equal(s2cCase('place_of_birth'), 'placeOfBirth','03')
			assert.equal(s2cCase('Place_ofBiRth'), 'PlaceOfBiRth','04')
			assert.equal(s2cCase('Place_of___biRth'), 'PlaceOfBiRth','04')
		})
	})
	describe('#objectC2Scase', () => {
		it('Should convert an object with snake case fields to camel case fields.', () => {
			const o = objectS2Ccase({
				moreInfo: 'Hello',
				first_name:'Nic',
				place_of_birth: 'Liege'
			})
			assert.equal(Object.keys(o).length, 3,'01')
			assert.equal(o.moreInfo, 'Hello','02')
			assert.equal(o.firstName, 'Nic','03')
			assert.equal(o.placeOfBirth, 'Liege','04')
		})
	})
	describe('#objectCapital2Ccase', () => {
		it('Should convert an object with capital case fields to camel case fields.', () => {
			const o = objectCapital2Ccase({
				MoreInfo: 'Hello',
				First_name:'Nic',
				Place_of_birth: 'Liege'
			})
			assert.equal(Object.keys(o).length, 3,'01')
			assert.equal(o.moreInfo, 'Hello','02')
			assert.equal(o.firstName, 'Nic','03')
			assert.equal(o.placeOfBirth, 'Liege','04')
		})
	})
})










/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/


/**********************************************************************************
 * 
 * A cache for Campaign SOAP methods definition
 * 
 *********************************************************************************/

const DomUtil = require('./dom.js').DomUtil;


function MethodCache() {
    // Key is schema id, value is a map whose key is a method name. Value is the DOM element
    // corresponding to a method
    this.methodsBySchema = {};

    // Key is schema id, value is a map whose key is a method name. Value is the SOAP action
    // for the method. For interface method (ex: xtk:session#Write, the SOAP action is actually
    // xtk:persist#Write, using the interface id, not the session id)
    this.soapUrns = {};
}

/**
 * Caches all methods of a schema
 * @param {Element} schema DOM document node represening the schema 
 */
MethodCache.prototype.cache = function(schema) {
    var namespace = DomUtil.getAttributeAsString(schema, "namespace");
    var name = DomUtil.getAttributeAsString(schema, "name");
    var impls = DomUtil.getAttributeAsString(schema, "implements");
    var root = DomUtil.getFirstChildElement(schema);
    while (root) {
        if (root.nodeName == "interface") {
            var itfName = namespace + ":" +  DomUtil.getAttributeAsString(root, "name");
            if (impls && impls === itfName) {
                var schemaId = namespace + ":" + name;
                var soapUrn = itfName;
            }
        }
        else if (root.nodeName == "methods") {
            var schemaId = namespace + ":" + name;
            var soapUrn = schemaId;
        }

        if (schemaId) {
            this.methodsBySchema[schemaId] = this.methodsBySchema[schemaId] || {};
            this.methodsBySchema[soapUrn] = this.methodsBySchema[soapUrn] || {};
            this.soapUrns[schemaId] = this.soapUrns[schemaId] || {};
            this.soapUrns[soapUrn] = this.soapUrns[soapUrn] || {};
            var child = DomUtil.getFirstChildElement(root, "method");
            while (child) {
                const methodName = DomUtil.getAttributeAsString(child, "name");
                this.methodsBySchema[schemaId][methodName] = child;
                this.methodsBySchema[soapUrn][methodName] = child; /// version 0.1.23: cache the method in both the schema id and interface id form compatibility reasons
                this.soapUrns[schemaId][methodName] = soapUrn;
                this.soapUrns[soapUrn][methodName] = soapUrn;
                child = DomUtil.getNextSiblingElement(child, "method");
            }
        }
        root = DomUtil.getNextSiblingElement(root);
    }
}

MethodCache.prototype.get = function(schemaId, methodName) {
    var dict = this.methodsBySchema[schemaId];
    if (dict) 
        dict = dict[methodName];
    return dict;
}

MethodCache.prototype.getSoapUrn = function(schemaId, methodName) {
    var soapUrn = this.soapUrns[schemaId];
    if (soapUrn) 
        soapUrn = soapUrn[methodName];
    return soapUrn;
}

MethodCache.prototype.clear = function() {
    this.methodsBySchema = {};
}

exports.MethodCache = MethodCache;
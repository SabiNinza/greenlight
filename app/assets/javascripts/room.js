// BigBlueButton open source conferencing system - http://www.bigbluebutton.org/.
//
// Copyright (c) 2018 BigBlueButton Inc. and by respective authors (see below).
//
// This program is free software; you can redistribute it and/or modify it under the
// terms of the GNU Lesser General Public License as published by the Free Software
// Foundation; either version 3.0 of the License, or (at your option) any later
// version.
//
// BigBlueButton is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
// PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License along
// with BigBlueButton; if not, see <http://www.gnu.org/licenses/>.

// Room specific js for copy button and email link.
$(document).on('turbolinks:load', function(){
  var controller = $("body").data('controller');
  var action = $("body").data('action');

  // highlight current room
  $('.room-block').removeClass('current');
  $('a[href="' + window.location.pathname + '"] .room-block').addClass('current');

  // Only run on room pages.
  if (controller == "rooms" && action == "show"){
    // Display and update all fields related to creating a room in the createRoomModal
    $("#create-room-block").click(function(){
      showCreateRoom(this)
    })

    checkIfAutoJoin()
  }

    // Autofocus on the Room Name label when creating a room only
  $('#createRoomModal').on('shown.bs.modal', function (){
    if ($(".create-only").css("display") == "block"){
      $('#create-room-name').focus()
    }
  })

  if (controller == "rooms" && action == "show" || controller == "admins" && action == "server_rooms"){
    // Display and update all fields related to creating a room in the createRoomModal
    $(".update-room").click(function(){
      showUpdateRoom(this)
    })

    $(".update-branding").click(function(){
      fetchBackImages();
    })

    $(".delete-room").click(function() {
      showDeleteRoom(this)
    })

    $('.selectpicker').selectpicker({
      liveSearchPlaceholder: getLocalizedString('javascript.search.start')
    });
    // Fixes turbolinks issue with bootstrap select
    $(window).trigger('load.bs.select.data-api');

    $(".share-room").click(function() {
      // Update the path of save button
      $("#save-access").attr("data-path", $(this).data("path"))

      // Get list of users shared with and display them
      displaySharedUsers($(this).data("users-path"))
    })

    $("#shareRoomModal").on("show.bs.modal", function() {
      $(".selectpicker").selectpicker('val','')
    })

    $(".bootstrap-select").on("click", function() {
      $(".bs-searchbox").siblings().hide()
    })

    $(".bs-searchbox input").on("input", function() {
      if ($(".bs-searchbox input").val() == '' || $(".bs-searchbox input").val().length < 3) {
        $(".bs-searchbox").siblings().hide()
      } else {
        $(".bs-searchbox").siblings().show()
      }
    })

    $(".remove-share-room").click(function() {
      $("#remove-shared-confirm").parent().attr("action", $(this).data("path"))
    })

    // User selects an option from the Room Access dropdown
    $(".bootstrap-select").on("changed.bs.select", function(){
      // Get the uid of the selected user
      let uid = $(".selectpicker").selectpicker('val')

      // If the value was changed to blank, ignore it
      if (uid == "") return

      let currentListItems = $("#user-list li").toArray().map(user => $(user).data("uid"))

      // Check to make sure that the user is not already there
      if (!currentListItems.includes(uid)) {
        // Create the faded list item and display it
        let option = $("option[value='" + uid + "']")

        let listItem = document.createElement("li")
        listItem.setAttribute('class', 'list-group-item text-left not-saved add-access');
        listItem.setAttribute("data-uid", uid)

        let spanItemAvatar = document.createElement("span"),
            spanItemName = document.createElement("span"),
            spanItemUser = document.createElement("span");
        spanItemAvatar.setAttribute('class', 'avatar float-left mr-2');
        spanItemAvatar.innerText = option.text().charAt(0);
        spanItemName.setAttribute('class', 'shared-user');
        spanItemName.innerText = option.text();
        spanItemUser.setAttribute('class', 'text-muted');
        spanItemUser.innerText = option.data('subtext');
        spanItemName.append(spanItemUser);

        listItem.innerHTML = "<span class='text-primary float-right shared-user cursor-pointer' onclick='removeSharedUser(this)'><i class='fas fa-times'></i></span>"
        listItem.prepend(spanItemName);
        listItem.prepend(spanItemAvatar);

        $("#user-list").append(listItem)
      }
    })

    $("#presentation-upload").change(function(data) {
      var file = data.target.files[0]

      // Check file type and size to make sure they aren't over the limit
      if (validFileUpload(file)) {
        $("#presentation-upload-label").text(file.name)
      } else {
        $("#invalid-file-type").show()
        $("#presentation-upload").val("")
        $("#presentation-upload-label").text($("#presentation-upload-label").data("placeholder"))
      }
    })

    $(".preupload-room").click(function() {
      updatePreuploadPresentationModal(this)
    })

    $("#remove-presentation").click(function(data) {
      removePreuploadPresentation($(this).data("remove"))
    })

    // trigger initial room filter
    filterRooms();
  }
  $('[data-toggle="tooltip"]').tooltip();
});

function copyInvite() {
  $('#invite-url').select()
  if (document.execCommand("copy")) {
    $('#invite-url').blur();
    copy = $("#copy-invite")
    copy.addClass('btn-success');
    copy.html("<i class='fas fa-check mr-1'></i>")// + getLocalizedString("copied"))
    setTimeout(function(){
      copy.removeClass('btn-success');
      copy.html("<i class='fas fa-copy mr-1'></i>")// + getLocalizedString("copy"))
    }, 1000)
  }
}

function copyAccess() {
  $('#copy-code').attr("type", "text")
  $('#copy-code').select()
  if (document.execCommand("copy")) {
    $('#copy-code').attr("type", "hidden")
    copy = $("#copy-access")
    copy.addClass('btn-success');
    copy.html("<i class='fas fa-check mr-1'></i>")// + getLocalizedString("copied"))
    setTimeout(function(){
      copy.removeClass('btn-success');
      copy.html("<i class='fas fa-key mr-1'></i>")// + getLocalizedString("room.copy_access"))
    }, 1000)
  }
}

function showCreateRoom(target) {
  $("#create-room-name").val("")
  $("#create-room-access-code").text(getLocalizedString("modal.create_room.access_code_placeholder"))
  $("#room_access_code").val(null)
  // $("#room_secondary_color").val(null)
  // $("#brand_icon_name").val(null)
  // $("#back_image_name").text(null)
  // $("#room_back_image").val(null)

  $("#createRoomModal form").attr("action", $("body").data('relative-root'))
  $("#room_mute_on_join").prop("checked", $("#room_mute_on_join").data("default"))
  $("#room_require_moderator_approval").prop("checked", $("#room_require_moderator_approval").data("default"))
  $("#room_anyone_can_start").prop("checked", $("#room_anyone_can_start").data("default"))
  $("#room_all_join_moderator").prop("checked", $("#room_all_join_moderator").data("default"))
  $("#room_recording").prop("checked", $("#room_recording").data("default"))

  //show all elements & their children with a create-only class
  $(".create-only").each(function() {
    $(this).show()
    if($(this).children().length > 0) { $(this).children().show() }
  })

  //hide all elements & their children with a update-only class
  $(".update-only").each(function() {
    $(this).attr('style',"display:none !important")
    if($(this).children().length > 0) { $(this).children().attr('style',"display:none !important") }
  })
}

function showUpdateRoom(target) {
  var modal = $(target)
  var update_path = modal.closest(".room-block").data("path")
  var settings_path = modal.data("settings-path")
  $("#create-room-name").val(modal.closest(".room-block").find(".room-name-text").text().trim())
//  let rpc = modal.closest(".room-block").find(".room-primarycolor-text").text().trim() || '#467FCF' //rpc = room primary color
//  $("#room-primary-color").val(rpc)
//  $("#selected-room-color").text(rpc).css('color',rpc);
  $("#createRoomModal form").attr("action", update_path)

  //show all elements & their children with a update-only class
  $(".update-only").each(function() {
    $(this).show()
    if($(this).children().length > 0) { $(this).children().show() }
  })

  //hide all elements & their children with a create-only class
  $(".create-only").each(function() {
    $(this).attr('style',"display:none !important")
    if($(this).children().length > 0) { $(this).children().attr('style',"display:none !important") }
  })

 // updateCurrentSettings(settings_path)
 // fetchBackImages()
  var accessCode = modal.closest(".room-block").data("room-access-code")

  if(accessCode){
    $("#create-room-access-code").text(getLocalizedString("modal.create_room.access_code") + ": " + accessCode)
    $("#room_access_code").val(accessCode)
  } else {
    $("#create-room-access-code").text(getLocalizedString("modal.create_room.access_code_placeholder"))
    $("#room_access_code").val(null)
  }
}

function showDeleteRoom(target) {
  $("#delete-header").text(getLocalizedString("modal.delete_room.confirm").replace("%{room}", $(target).data("name")))
  $("#delete-confirm").parent().attr("action", $(target).data("path"))
}

//Update the createRoomModal to show the correct current settings
function updateCurrentSettings(settings_path){
  // Get current room settings and set checkbox
  $.get(settings_path, function(settings) {
    $("#room_mute_on_join").prop("checked", $("#room_mute_on_join").data("default") || settings.muteOnStart)
    $("#room_require_moderator_approval").prop("checked", $("#room_require_moderator_approval").data("default") || settings.requireModeratorApproval)
    $("#room_anyone_can_start").prop("checked", $("#room_anyone_can_start").data("default") || settings.anyoneCanStart)
    $("#room_all_join_moderator").prop("checked", $("#room_all_join_moderator").data("default") || settings.joinModerator)
    $("#room_recording").prop("checked", $("#room_recording").data("default") || Boolean(settings.recording))
    $("#room_secondary_color").val(settings.secondaryColor)
    $("#brand_icon_name").val(settings.brandImage || null)
    $("#back_image_name").text(settings.backImage || null)
    $("#room_back_image").val(settings.backImage || null)
  })
}

function selectBrandImage(sourceID,targetID){
  let fileName = document.getElementById(sourceID).files[0].name;
  document.getElementById(targetID).value = fileName;
  document.getElementById(targetID).text = fileName;
}
function selectBackImage(targetID){
  let title = this.dataset.title;
  let backImage = this.dataset.backimage;
  document.getElementById("back_image").value = backImage;
  document.getElementById(targetID).innerText = title;
}

function generateAccessCode(){
  const accessCodeLength = 6
  var validCharacters = "0123456789"
  var accessCode = ""

  for( var i = 0; i < accessCodeLength; i++){
    accessCode += validCharacters.charAt(Math.floor(Math.random() * validCharacters.length));
  }

  $("#create-room-access-code").text(getLocalizedString("modal.create_room.access_code") + ": " + accessCode)
  $("#room_access_code").val(accessCode)
}

function ResetAccessCode(){
  $("#create-room-access-code").text(getLocalizedString("modal.create_room.access_code_placeholder"))
  $("#room_access_code").val(null)
}

function saveAccessChanges() {
  let listItemsToAdd = $("#user-list li:not(.remove-shared)").toArray().map(user => $(user).data("uid"))

  $.post($("#save-access").data("path"), {add: listItemsToAdd})
}
// set room primary theme color on click 
function setRoomPrimaryColor(pc){
  $("#room-primary-color").val(pc);
  $("#selected-room-color").text(pc).css('color',pc);
}
// fetch back images using api
function fetchBackImages(){
  fetch('https://api.cast.video.wiki/api/photos/?category=all')
    .then(res => res.json())
    .then(data => {
      if(data.data.length){
        const imgContainer = document.createElement('div')
        for(let i=0; i<data.data.length;i++){
          const imgHolder = document.createElement('div')
          imgHolder.className = "position-relative cat-image-holder"
          imgHolder.dataset.category = data.data[i].category
          const image = document.createElement('img')
          image.src = data.data[i].low_quality_url
          image.className = "mt-1 cursor-pointer all "+data.data[i].category
          image.dataset.dismiss = "modal"
          image.dataset.target = "#roomBrandingModal"
          image.dataset.toggle = "modal"
          image.dataset.backimage = data.data[i].high_quality_url
          image.dataset.title = data.data[i].title
          image.addEventListener('click',selectBackImage.bind(image,'back_image_name'),false)
          imgHolder.appendChild(image)
          const details = document.createElement('p')
          details.className = "position-absolute m-0 p-2 text-white text-right"
          details.innerText = "Photo Credit : "+data.data[i].credit
          $(details).css({'font-weight':'bold','right':0,'left':0,'bottom':0,'background':'rgba(0,0,0,0.7)','font-style':'italic'})
          imgHolder.appendChild(details)
          imgContainer.appendChild(imgHolder)
        }
        $(imgContainer).appendTo($("#backImageCollection"))
      }
    }).
    catch(error => {throw error;})
}
// show and hide images on click according to category
function chooseCategory(cat){
  let allCat = document.getElementsByClassName('cat-image-holder')
  for(let c of allCat){
    c.style.display = 'none'
    if(c.dataset.category == cat.toLowerCase()){
      c.style.display = 'block'
    }
    if(cat.toLowerCase() === 'all'){
      c.style.display = 'block'
    }
  }
}
// Get list of users shared with and display them
function displaySharedUsers(path) {
  $.get(path, function(users) {
    // Create list element and add to user list
    var user_list_html = ""

    users.forEach(function(user) {
      user_list_html += "<li class='list-group-item text-left' data-uid='" + user.uid + "'>"

      if (user.image) {
        user_list_html += "<img id='user-image' class='avatar float-left mr-2' src='" + user.image + "'></img>"
      } else {
        user_list_html += "<span class='avatar float-left mr-2'>" + user.name.charAt(0) + "</span>"
      }
      user_list_html += "<span class='shared-user'>" + user.name + "<span class='text-muted ml-1'>" + user.uid + "</span></span>"
      user_list_html += "<span class='text-primary float-right shared-user cursor-pointer' onclick='removeSharedUser(this)'><i class='fas fa-times'></i></span>"
      user_list_html += "</li>"
    })

    $("#user-list").html(user_list_html)
  });
}

// Removes the user from the list of shared users
function removeSharedUser(target) {
  let parentLI = target.closest("li")

  if (parentLI.classList.contains("not-saved")) {
    parentLI.parentNode.removeChild(parentLI)
  } else {
    parentLI.removeChild(target)
    parentLI.classList.add("remove-shared")
  }
}

function updatePreuploadPresentationModal(target) {
  $.get($(target).data("settings-path"), function(presentation) {
    if(presentation.attached) {
      $("#current-presentation").show()
      $("#presentation-name").text(presentation.name)
      $("#change-pres").show()
      $("#use-pres").hide()
    } else {
      $("#current-presentation").hide()
      $("#change-pres").hide()
      $("#use-pres").show()
    }
  });
  
  $("#preuploadPresentationModal form").attr("action", $(target).data("path"))
  $("#remove-presentation").data("remove",  $(target).data("remove"))
  
  // Reset values to original to prevent confusion
  $("#presentation-upload").val("")
  $("#presentation-upload-label").text($("#presentation-upload-label").data("placeholder"))
  $("#invalid-file-type").hide()
}

function removePreuploadPresentation(path) {
  $.post(path, {})
}

function validFileUpload(file) {
  return file.size/1024/1024 <= 30
}

// Automatically click the join button if this is an action cable reload
function checkIfAutoJoin() {
  var url = new URL(window.location.href)

  if (url.searchParams.get("reload") == "true") {
    $("#joiner-consent").click()
    $("#room-join").click()
  }
}

function filterRooms() {
  let search = $('#room-search').val()

  if (search == undefined) { return }

  let search_term = search.toLowerCase(),
        rooms = $('#room_block_container > div:not(:last-child)');
        clear_room_search = $('#clear-room-search');

  if (search_term) {
    clear_room_search.show();
  } else {
    clear_room_search.hide();
  }

  rooms.each(function(i, room) {
    let text = $(this).find('h4').text();
    room.style.display = (text.toLowerCase().indexOf(search_term) < 0) ? 'none' : 'flex';
  })
}

function clearRoomSearch() {
  $('#room-search').val(''); 
  filterRooms()
}

function joinAttendee(id,n,e,r,p,s,rp){
  event.preventDefault();
  n = n || document.querySelector('input.joinee-name').value;
  let data = {"class_id":id,"name":n,"email":e,"role":r,"picture":p,"session":s};
  $.ajax({
    url: "https://dev.cast.api.video.wiki/api/class/joinee/details/",
    method: "POST",
    data: data,
    error: function(jqXHR, textStatus, error) {
      console.log('jqXHR:', jqXHR);
      console.log('textStatus:', textStatus);
      console.log('error:', error);
    },
    success: function(data) {
      rp.submit();
    }
  })
}
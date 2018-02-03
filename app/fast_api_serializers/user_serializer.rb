class UserSerializer < FastJsonSerializer
  set_type 'users'
  attributes :id, :first_name, :last_name, :email,
             :pic_url_square, :created_at
end
